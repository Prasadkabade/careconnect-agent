import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock, Heart, Brain, Baby, Bone, Palette, User as UserIcon, Mail, Phone, CheckCircle } from 'lucide-react';
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
}

export const AppointmentBooking = ({ user }: AppointmentBookingProps) => {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
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

  return (
    <section id="appointments" className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Book Your Appointment
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose your preferred doctor and schedule your visit
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Doctor Selection */}
          <div className="space-y-6">
            <Card className="border-0 shadow-medical bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span>Select Doctor</span>
                </CardTitle>
                <CardDescription>
                  Choose from our experienced medical professionals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="h-12 w-12 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-lg">
                                Dr. {doctor.first_name} {doctor.last_name}
                              </h3>
                              <Badge variant="secondary" className="bg-primary/10 text-primary">
                                ${doctor.consultation_fee}
                              </Badge>
                            </div>
                            <p className="text-primary font-medium mb-2">{doctor.specialty}</p>
                            <p className="text-sm text-muted-foreground mb-3">{doctor.bio}</p>
                            <div className="flex items-center justify-between text-sm">
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
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="space-y-6">
            <Card className="border-0 shadow-medical bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <span>Appointment Details</span>
                </CardTitle>
                <CardDescription>
                  Fill in your information and preferred schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-2 gap-4">
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

                  {/* Appointment Schedule */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Schedule</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="appointmentDate">Preferred Date</Label>
                        <Input
                          id="appointmentDate"
                          type="date"
                          min={getMinDate()}
                          max={getMaxDate()}
                          value={formData.appointmentDate}
                          onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="appointmentTime">Preferred Time</Label>
                        <Select
                          value={formData.appointmentTime}
                          onValueChange={(value) => setFormData({ ...formData, appointmentTime: value })}
                        >
                          <SelectTrigger>
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
                    <div className="space-y-2">
                      <Label htmlFor="reasonForVisit">Reason for Visit</Label>
                      <Textarea
                        id="reasonForVisit"
                        placeholder="Please describe your symptoms or reason for the appointment..."
                        value={formData.reasonForVisit}
                        onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })}
                        rows={3}
                        required
                      />
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
                      <div className="grid grid-cols-2 gap-4">
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

                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary hover:opacity-90 text-white font-medium shadow-medical transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                    disabled={isLoading || !selectedDoctor}
                  >
                    {isLoading ? 'Booking Appointment...' : 'Book Appointment'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};