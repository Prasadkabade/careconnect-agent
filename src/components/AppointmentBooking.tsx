import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock, Heart, Brain, Baby, Bone, Palette, User as UserIcon, Mail, Phone, CheckCircle, ArrowRight, ArrowLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { User } from '@supabase/supabase-js';

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  rating: number;
  years_experience: number;
  consultation_fee: number;
  bio: string;
  is_available: boolean;
}

const specialtyIcons = {
  'Cardiology': Heart,
  'Neurology': Brain,
  'Pediatrics': Baby,
  'Orthopedics': Bone,
  'Dermatology': Palette,
};

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

// Fallback doctors used when database is unavailable
const fallbackDoctors: Doctor[] = [
  { id: 'd1', first_name: 'Sarah', last_name: 'Johnson', specialty: 'Cardiology', rating: 4.9, years_experience: 15, consultation_fee: 120, bio: 'Expert cardiologist specializing in preventive care.', is_available: true },
  { id: 'd2', first_name: 'Michael', last_name: 'Chen', specialty: 'Neurology', rating: 4.8, years_experience: 12, consultation_fee: 110, bio: 'Neurologist with focus on stroke and epilepsy.', is_available: true },
  { id: 'd3', first_name: 'Emily', last_name: 'Rodriguez', specialty: 'Pediatrics', rating: 4.9, years_experience: 10, consultation_fee: 100, bio: 'Pediatrician providing compassionate child care.', is_available: true },
];

interface AppointmentBookingProps {
  user?: User | null;
  preSelectedDoctor?: Doctor | null;
}

export const AppointmentBooking = ({ user, preSelectedDoctor }: AppointmentBookingProps) => {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(preSelectedDoctor || null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    dateOfBirth: '',
    appointmentDate: '',
    appointmentTime: '',
    reasonForVisit: '',
    insuranceCarrier: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (preSelectedDoctor) {
      setSelectedDoctor(preSelectedDoctor);
      setCurrentStep(2); // Skip to step 2 when doctor is pre-selected
    }
  }, [preSelectedDoctor]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_available', true)
        .order('first_name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching doctors',
        description: error.message,
        variant: 'destructive',
      });
      // Use local fallback data so the UI remains functional
      setDoctors(fallbackDoctors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) {
      toast({
        title: 'Please select a doctor',
        description: 'You must choose a doctor for your appointment.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // First create or update patient record
      const { data: existingPatient, error: checkError } = await supabase
        .from('patients')
        .select('id')
        .eq('email', formData.email)
        .single();

      let patientId;

      if (existingPatient) {
        patientId = existingPatient.id;
        // Update existing patient
        const { error: updateError } = await supabase
          .from('patients')
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            date_of_birth: formData.dateOfBirth,
            emergency_contact_name: formData.emergencyContactName,
            emergency_contact_phone: formData.emergencyContactPhone,
            insurance_carrier: formData.insuranceCarrier,
            patient_type: 'returning'
          })
          .eq('id', patientId);

        if (updateError) throw updateError;
      } else {
        // Create new patient
        const { data: newPatient, error: createError } = await supabase
          .from('patients')
          .insert({
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            date_of_birth: formData.dateOfBirth,
            emergency_contact_name: formData.emergencyContactName,
            emergency_contact_phone: formData.emergencyContactPhone,
            insurance_carrier: formData.insuranceCarrier,
            patient_type: 'new'
          })
          .select('id')
          .single();

        if (createError) throw createError;
        patientId = newPatient.id;
      }

      // Create appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: patientId,
          doctor_id: selectedDoctor.id,
          appointment_date: formData.appointmentDate,
          appointment_time: formData.appointmentTime,
          reason_for_visit: formData.reasonForVisit,
          duration_minutes: existingPatient ? 30 : 60, // 30 min for returning, 60 for new
          status: 'pending'
        });

      if (appointmentError) throw appointmentError;

      // Send confirmation notification
      try {
        await supabase.functions.invoke('send-appointment-notification', {
          body: {
            patientEmail: formData.email,
            patientName: `${formData.firstName} ${formData.lastName}`,
            doctorName: `${selectedDoctor.first_name} ${selectedDoctor.last_name}`,
            appointmentDate: formData.appointmentDate,
            appointmentTime: formData.appointmentTime,
            type: 'confirmation'
          }
        });

        // Schedule reminder (in a real app, this would be handled by a background job)
        const reminderDate = new Date(`${formData.appointmentDate} ${formData.appointmentTime}`);
        reminderDate.setHours(reminderDate.getHours() - 2); // 2 hours before
        
        if (reminderDate > new Date()) {
          setTimeout(async () => {
            await supabase.functions.invoke('send-appointment-notification', {
              body: {
                patientEmail: formData.email,
                patientName: `${formData.firstName} ${formData.lastName}`,
                doctorName: `${selectedDoctor.first_name} ${selectedDoctor.last_name}`,
                appointmentDate: formData.appointmentDate,
                appointmentTime: formData.appointmentTime,
                type: 'reminder'
              }
            });
          }, reminderDate.getTime() - new Date().getTime());
        }
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }

      toast({
        title: 'Appointment booked!',
        description: `Your appointment with Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name} has been scheduled for ${formData.appointmentDate} at ${formData.appointmentTime}. Confirmation email sent!`,
        duration: 5000,
      });

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: user?.email || '',
        phone: '',
        dateOfBirth: '',
        appointmentDate: '',
        appointmentTime: '',
        reasonForVisit: '',
        insuranceCarrier: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
      });
      setSelectedDoctor(null);
      setCurrentStep(1);

    } catch (error: any) {
      toast({
        title: 'Booking failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Next day
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // 3 months ahead
    return maxDate.toISOString().split('T')[0];
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'active';
    return 'upcoming';
  };

  return (
    <section id="appointments" className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Book Your Appointment
          </h1>
          <p className="text-muted-foreground text-lg">
            Follow these simple steps to schedule your visit
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-8">
            {[
              { step: 1, title: 'Select Doctor', icon: Heart },
              { step: 2, title: 'Choose Date & Time', icon: CalendarIcon },
              { step: 3, title: 'Confirm Details', icon: CheckCircle }
            ].map(({ step, title, icon: Icon }, index) => {
              const status = getStepStatus(step);
              return (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        status === 'completed'
                          ? 'bg-primary border-primary text-white'
                          : status === 'active'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`text-sm font-medium mt-2 ${
                        status === 'active' ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {title}
                    </span>
                  </div>
                  {index < 2 && (
                    <ChevronRight className="h-5 w-5 text-muted-foreground mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-0 shadow-medical bg-card/80 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Step 1: Doctor Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Select Your Doctor</h2>
                  <p className="text-muted-foreground">Choose from our experienced medical professionals</p>
                </div>
                
                <div className="grid gap-4 max-h-96 overflow-y-auto">
                  {doctors.map((doctor) => {
                    const IconComponent = specialtyIcons[doctor.specialty as keyof typeof specialtyIcons] || Heart;
                    return (
                      <Card 
                        key={doctor.id} 
                        className={`cursor-pointer transition-all duration-300 hover:shadow-medical ${
                          selectedDoctor?.id === doctor.id ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedDoctor(doctor)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="h-16 w-16 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                              <IconComponent className="h-8 w-8 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-xl">
                                  Dr. {doctor.first_name} {doctor.last_name}
                                </h3>
                                <Badge variant="secondary" className="bg-primary/10 text-primary text-sm">
                                  ${doctor.consultation_fee}
                                </Badge>
                              </div>
                              <p className="text-primary font-medium mb-2 text-lg">{doctor.specialty}</p>
                              <p className="text-muted-foreground mb-4">{doctor.bio}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  {doctor.years_experience} years experience
                                </span>
                                <div className="flex items-center space-x-1">
                                  <span>⭐</span>
                                  <span className="font-medium">{doctor.rating}/5.0</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex justify-end mt-8">
                  <Button 
                    onClick={nextStep} 
                    disabled={!selectedDoctor}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    Continue to Date & Time
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Date & Time Selection */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Choose Date & Time</h2>
                  <p className="text-muted-foreground">Select your preferred appointment schedule</p>
                  {selectedDoctor && (
                    <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                      <p className="text-sm text-muted-foreground">Appointment with</p>
                      <p className="font-semibold text-lg">Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}</p>
                      <p className="text-primary">{selectedDoctor.specialty}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label htmlFor="appointmentDate" className="text-lg font-medium">Preferred Date</Label>
                    <Input
                      id="appointmentDate"
                      type="date"
                      min={getMinDate()}
                      max={getMaxDate()}
                      value={formData.appointmentDate}
                      onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                      className="h-12 text-lg"
                      required
                    />
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="appointmentTime" className="text-lg font-medium">Preferred Time</Label>
                    <Select
                      value={formData.appointmentTime}
                      onValueChange={(value) => setFormData({ ...formData, appointmentTime: value })}
                    >
                      <SelectTrigger className="h-12 text-lg">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>{time}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="reasonForVisit" className="text-lg font-medium">Reason for Visit</Label>
                  <Textarea
                    id="reasonForVisit"
                    placeholder="Please describe your symptoms or reason for the appointment..."
                    value={formData.reasonForVisit}
                    onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })}
                    rows={4}
                    className="text-lg"
                    required
                  />
                </div>

                <div className="flex justify-between mt-8">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Doctor Selection
                  </Button>
                  <Button 
                    onClick={nextStep} 
                    disabled={!formData.appointmentDate || !formData.appointmentTime || !formData.reasonForVisit}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    Continue to Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Personal Details & Confirmation */}
            {currentStep === 3 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Complete Your Details</h2>
                  <p className="text-muted-foreground">Fill in your information to confirm the appointment</p>
                </div>

                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Insurance & Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Additional Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="insuranceCarrier">Insurance Carrier</Label>
                      <Select
                        value={formData.insuranceCarrier}
                        onValueChange={(value) => setFormData({ ...formData, insuranceCarrier: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select insurance carrier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Blue Cross">Blue Cross</SelectItem>
                          <SelectItem value="Aetna">Aetna</SelectItem>
                          <SelectItem value="Cigna">Cigna</SelectItem>
                          <SelectItem value="United Healthcare">United Healthcare</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                        <Input
                          id="emergencyContactName"
                          value={formData.emergencyContactName}
                          onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                        <Input
                          id="emergencyContactPhone"
                          type="tel"
                          value={formData.emergencyContactPhone}
                          onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appointment Summary */}
                {selectedDoctor && (
                  <div className="bg-primary/5 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Appointment Summary</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Doctor:</span> Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}</p>
                      <p><span className="font-medium">Specialty:</span> {selectedDoctor.specialty}</p>
                      <p><span className="font-medium">Date:</span> {formData.appointmentDate}</p>
                      <p><span className="font-medium">Time:</span> {formData.appointmentTime}</p>
                      <p><span className="font-medium">Consultation Fee:</span> ${selectedDoctor.consultation_fee}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Date & Time
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-primary hover:opacity-90 text-white font-medium shadow-medical transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                    disabled={isLoading || !selectedDoctor}
                  >
                    {isLoading ? 'Booking Appointment...' : 'Confirm Appointment'}
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};