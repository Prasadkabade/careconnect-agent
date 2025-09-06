import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const predefinedResponses: { [key: string]: string } = {
  appointment: "To book an appointment, scroll down to the 'Book Your Appointment' section or click 'Book Appointment' next to any doctor in our 'Meet Our Expert Doctors' section. Follow the 3-step process: Select Doctor → Choose Date & Time → Confirm Details.",
  doctors: "Our expert doctors include Dr. Sarah Johnson (Cardiologist), Dr. Michael Chen (Neurologist), Dr. Emily Rodriguez (Pediatrician), and Dr. James Wilson (Orthopedic Surgeon). You can view their full profiles and book directly with them in the 'Meet Our Expert Doctors' section.",
  emergency: "For medical emergencies, please call 911 immediately or visit your nearest emergency room. For urgent but non-emergency care, you can call our emergency hotline at (555) 123-4567.",
  hours: "Our clinic is open Monday to Friday 9:00 AM - 6:00 PM, and Saturday 9:00 AM - 2:00 PM. We're closed on Sundays. Available appointment slots are 9:00 AM - 11:30 AM and 2:00 PM - 4:30 PM.",
  insurance: "We accept most major insurance plans including Blue Cross, Aetna, Cigna, and United Healthcare. Please bring your insurance card to your appointment. You can select your insurance carrier during the booking process.",
  services: "We offer comprehensive medical services including routine checkups, preventive care, specialist consultations (Cardiology, Neurology, Pediatrics, Orthopedics), diagnostic tests, and emergency care. Each doctor specializes in specific treatments.",
  contact: "You can reach us at (555) 123-4567 or email us at info@medibook.com. Our clinic is located at 123 Medical Center Drive. You can also book appointments directly through this website.",
  fees: "Consultation fees vary by specialist: Dr. Johnson (Cardiology) - $120, Dr. Chen (Neurology) - $110, Dr. Rodriguez (Pediatrics) - $100, Dr. Wilson (Orthopedics) - $130. Fees are displayed when you select a doctor.",
  booking: "Our 3-step booking process is: 1) Select your preferred doctor from our expert team, 2) Choose your preferred date and time (we're available Monday-Saturday), 3) Fill in your personal details and confirm. You'll receive email confirmation and reminders.",
  notifications: "After booking, you'll receive an immediate email confirmation. We also send reminder notifications 2 hours before your scheduled appointment to both your email and phone number.",
  admin: "Appointments require admin approval. After booking, an admin will review and either confirm or reschedule your appointment based on availability. You'll be notified of the status change.",
  default: "I'm your MediBook assistant! I can help you with booking appointments, finding doctors, understanding our services, checking hours, insurance questions, and general information about our medical center. What would you like to know?"
};

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm here to help you with any questions about our medical services, appointments, or doctors. How can I assist you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('appointment') || lowerMessage.includes('book') || lowerMessage.includes('schedule')) {
      return predefinedResponses.appointment;
    }
    if (lowerMessage.includes('doctor') || lowerMessage.includes('physician') || lowerMessage.includes('specialist')) {
      return predefinedResponses.doctors;
    }
    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent')) {
      return predefinedResponses.emergency;
    }
    if (lowerMessage.includes('hours') || lowerMessage.includes('time') || lowerMessage.includes('open')) {
      return predefinedResponses.hours;
    }
    if (lowerMessage.includes('insurance') || lowerMessage.includes('coverage')) {
      return predefinedResponses.insurance;
    }
    if (lowerMessage.includes('service') || lowerMessage.includes('treatment')) {
      return predefinedResponses.services;
    }
    if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('address')) {
      return predefinedResponses.contact;
    }
    if (lowerMessage.includes('fee') || lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('payment')) {
      return predefinedResponses.fees;
    }
    if (lowerMessage.includes('how to book') || lowerMessage.includes('booking process') || lowerMessage.includes('steps')) {
      return predefinedResponses.booking;
    }
    if (lowerMessage.includes('notification') || lowerMessage.includes('reminder') || lowerMessage.includes('confirmation')) {
      return predefinedResponses.notifications;
    }
    if (lowerMessage.includes('admin') || lowerMessage.includes('approval') || lowerMessage.includes('confirm')) {
      return predefinedResponses.admin;
    }
    
    return predefinedResponses.default;
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate bot response delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getResponse(inputText),
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);

    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 transition-all duration-300",
          "bg-gradient-primary hover:shadow-xl hover:scale-110",
          isOpen && "rotate-180"
        )}
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chatbot Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 h-96 shadow-xl z-40 border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-primary">
              <Bot className="h-5 w-5" />
              <span>MediBook Assistant</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex flex-col h-full pb-4">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start space-x-2",
                    message.isBot ? "justify-start" : "justify-end"
                  )}
                >
                  {message.isBot && (
                    <div className="h-8 w-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[200px] p-3 rounded-lg text-sm",
                      message.isBot
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    {message.text}
                  </div>
                  
                  {!message.isBot && (
                    <div className="h-8 w-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex space-x-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button onClick={handleSendMessage} size="icon" className="bg-primary">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};