import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  Users, 
  UserCheck, 
  Activity, 
  Search, 
  Download, 
  Mail, 
  Shield,
  Heart,
  Brain,
  Baby,
  Bone,
  Palette,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  patient_type: 'new' | 'returning';
  insurance_carrier: string;
  created_at: string;
}

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  rating: number;
  years_experience: number;
  consultation_fee: number;
  is_available: boolean;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason_for_visit: string;
  patients: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    patient_type: 'new' | 'returning';
  };
  doctors: {
    first_name: string;
    last_name: string;
    specialty: string;
  };
  reminder_sent: boolean;
  confirmation_sent: boolean;
}

const specialtyIcons = {
  'Cardiology': Heart,
  'Neurology': Brain,
  'Pediatrics': Baby,
  'Orthopedics': Bone,
  'Dermatology': Palette,
};

const statusColors = {
  pending: 'bg-amber-500',
  confirmed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
  completed: 'bg-blue-500',
};

export const AdminDashboard = ({ onSignOut }: { onSignOut: () => void }) => {
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (patientsError) throw patientsError;

      // Fetch doctors
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('*')
        .order('first_name');

      if (doctorsError) throw doctorsError;

      // Fetch appointments with patient and doctor details
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (
            first_name,
            last_name,
            email,
            phone,
            patient_type
          ),
          doctors (
            first_name,
            last_name,
            specialty
          )
        `)
        .order('appointment_date', { ascending: false });

      if (appointmentsError) throw appointmentsError;

      setPatients(patientsData || []);
      setDoctors(doctorsData || []);
      setAppointments(appointmentsData || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: 'Status updated',
        description: `Appointment status changed to ${status}`,
      });
      
      fetchDashboardData();
    } catch (error: any) {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExportData = () => {
    const csvData = appointments.map(apt => ({
      Date: apt.appointment_date,
      Time: apt.appointment_time,
      Patient: `${apt.patients.first_name} ${apt.patients.last_name}`,
      Doctor: `${apt.doctors.first_name} ${apt.doctors.last_name}`,
      Specialty: apt.doctors.specialty,
      Status: apt.status,
      Reason: apt.reason_for_visit,
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export successful',
      description: 'Appointments data has been exported to CSV',
    });
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name} ${patient.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalPatients: patients.length,
    newPatients: patients.filter(p => p.patient_type === 'new').length,
    totalAppointments: appointments.length,
    pendingAppointments: appointments.filter(a => a.status === 'pending').length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your clinic operations efficiently
            </p>
          </div>
          <Button
            onClick={onSignOut}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-medical bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.totalPatients}</div>
              <p className="text-xs text-blue-600 mt-1">
                {stats.newPatients} new this month
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-medical bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Active Doctors</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{doctors.filter(d => d.is_available).length}</div>
              <p className="text-xs text-green-600 mt-1">
                {doctors.length} total doctors
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-medical bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Total Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats.totalAppointments}</div>
              <p className="text-xs text-purple-600 mt-1">
                All time bookings
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-medical bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Pending</CardTitle>
              <Activity className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{stats.pendingAppointments}</div>
              <p className="text-xs text-orange-600 mt-1">
                Awaiting confirmation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm">
            <TabsTrigger value="appointments" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Appointments
            </TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Patients
            </TabsTrigger>
            <TabsTrigger value="doctors" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Doctors
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-6">
            <Card className="border-0 shadow-medical bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Appointments</span>
                  <Button 
                    onClick={handleExportData}
                    variant="outline" 
                    size="sm"
                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </CardTitle>
                <CardDescription>
                  Manage and track all patient appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reminders</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.slice(0, 10).map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{appointment.appointment_date}</div>
                              <div className="text-sm text-muted-foreground">{appointment.appointment_time}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {appointment.patients.first_name} {appointment.patients.last_name}
                            </div>
                            <Badge variant={appointment.patients.patient_type === 'new' ? 'default' : 'secondary'} className="text-xs">
                              {appointment.patients.patient_type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {(() => {
                              const IconComponent = specialtyIcons[appointment.doctors.specialty as keyof typeof specialtyIcons] || Heart;
                              return <IconComponent className="h-4 w-4 text-muted-foreground" />;
                            })()}
                            <div>
                              <div className="font-medium">
                                Dr. {appointment.doctors.first_name} {appointment.doctors.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">{appointment.doctors.specialty}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[appointment.status]} text-white`}>
                            {appointment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {appointment.reminder_sent ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            {appointment.confirmation_sent ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {appointment.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateAppointmentStatus(appointment.id, 'confirmed')}
                                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                              >
                                Confirm
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateAppointmentStatus(appointment.id, 'cancelled')}
                              className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                            >
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <Card className="border-0 shadow-medical bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Patient Records</CardTitle>
                <CardDescription>
                  View and search patient information
                </CardDescription>
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Insurance</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.slice(0, 10).map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>
                          <div className="font-medium">
                            {patient.first_name} {patient.last_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{patient.email}</div>
                            <div className="text-sm text-muted-foreground">{patient.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>{patient.date_of_birth}</TableCell>
                        <TableCell>
                          <Badge variant={patient.patient_type === 'new' ? 'default' : 'secondary'}>
                            {patient.patient_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{patient.insurance_carrier}</TableCell>
                        <TableCell>{new Date(patient.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="doctors" className="space-y-6">
            <Card className="border-0 shadow-medical bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Doctor Schedules</CardTitle>
                <CardDescription>
                  Manage doctor availability and schedules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {doctors.map((doctor) => {
                    const IconComponent = specialtyIcons[doctor.specialty as keyof typeof specialtyIcons] || Heart;
                    return (
                      <Card key={doctor.id} className="border-primary/20 hover:shadow-medical transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center">
                                <IconComponent className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">
                                  Dr. {doctor.first_name} {doctor.last_name}
                                </CardTitle>
                                <CardDescription>{doctor.specialty}</CardDescription>
                              </div>
                            </div>
                            <Badge variant={doctor.is_available ? 'default' : 'secondary'}>
                              {doctor.is_available ? 'Available' : 'Unavailable'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Experience:</span>
                              <span>{doctor.years_experience} years</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Rating:</span>
                              <span>⭐ {doctor.rating}/5.0</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Fee:</span>
                              <span>${doctor.consultation_fee}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-medical bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Appointment Analytics</CardTitle>
                  <CardDescription>
                    Overview of appointment statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Confirmed</span>
                    </div>
                    <span className="font-semibold text-green-700">
                      {appointments.filter(a => a.status === 'confirmed').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-amber-600" />
                      <span>Pending</span>
                    </div>
                    <span className="font-semibold text-amber-700">
                      {appointments.filter(a => a.status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span>Cancelled</span>
                    </div>
                    <span className="font-semibold text-red-700">
                      {appointments.filter(a => a.status === 'cancelled').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      <span>Completed</span>
                    </div>
                    <span className="font-semibold text-blue-700">
                      {appointments.filter(a => a.status === 'completed').length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-medical bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Patient Demographics</CardTitle>
                  <CardDescription>
                    Breakdown of patient types
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span>New Patients</span>
                    </div>
                    <span className="font-semibold text-blue-700">
                      {patients.filter(p => p.patient_type === 'new').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-5 w-5 text-purple-600" />
                      <span>Returning Patients</span>
                    </div>
                    <span className="font-semibold text-purple-700">
                      {patients.filter(p => p.patient_type === 'returning').length}
                    </span>
                  </div>
                  <div className="pt-4">
                    <Button 
                      onClick={handleExportData}
                      className="w-full bg-gradient-primary hover:opacity-90 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export All Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};