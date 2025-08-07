import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, User, Building, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Email inválido").refine(
    email => email.endsWith('@nextest.com.br'),
    "Email deve ser do domínio @nextest.com.br"
  )
});

const verifySchema = z.object({
  code: z.string().length(6, "Código deve ter 6 dígitos")
});

const registerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").refine(
    email => email.endsWith('@nextest.com.br'),
    "Email deve ser do domínio @nextest.com.br"
  ),
  department: z.string().min(1, "Departamento é obrigatório")
});

type LoginForm = z.infer<typeof loginSchema>;
type VerifyForm = z.infer<typeof verifySchema>;
type RegisterForm = z.infer<typeof registerSchema>;

type Screen = 'login' | 'verification' | 'register';

export default function Login() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [userEmail, setUserEmail] = useState('');
  const { login, verify, register } = useAuth();
  const { toast } = useToast();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '' }
  });

  const verifyForm = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: '' }
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', department: '' }
  });

  const onLogin = async (data: LoginForm) => {
    try {
      await login(data.email);
      setUserEmail(data.email);
      setCurrentScreen('verification');
      toast({
        title: "Código enviado!",
        description: "Verifique seu email para o código de verificação."
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const onVerify = async (data: VerifyForm) => {
    try {
      await verify(userEmail, data.code);
      toast({
        title: "Login realizado!",
        description: "Bem-vindo ao Portal de Tutoriais."
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const onRegister = async (data: RegisterForm) => {
    try {
      await register(data.name, data.email, data.department);
      toast({
        title: "Conta criada!",
        description: "Agora você pode fazer login."
      });
      setCurrentScreen('login');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const LoginScreen = () => (
    <div className="glass-effect rounded-3xl shadow-2xl p-8 w-full max-w-md animate-slide-up">
      <div className="text-center mb-8">
        <img 
          src="https://educanextest.com.br/wp-content/uploads/2024/04/Group-13Logo-Horizontal-Educa-SVG-Fix.svg" 
          alt="Educa Nextest Logo" 
          className="w-48 mx-auto mb-6 drop-shadow-sm"
        />
        <h1 className="text-2xl font-semibold text-nextest-dark mb-2">Portal de Tutoriais</h1>
        <p className="text-gray-600 text-sm">Faça login para acessar o sistema de liberação</p>
      </div>

      <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email Corporativo</Label>
          <Input
            id="email"
            type="email"
            placeholder="seuemail@nextest.com.br"
            {...loginForm.register("email")}
            data-testid="input-email"
          />
          {loginForm.formState.errors.email && (
            <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full gradient-button text-white hover:scale-[1.02] transition-all duration-300"
          data-testid="button-login"
        >
          <Mail className="mr-2 h-4 w-4" />
          Enviar Código de Acesso
        </Button>
      </form>

      <div className="text-center mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600 mb-3">Não possui conta?</p>
        <Button 
          variant="ghost"
          onClick={() => setCurrentScreen('register')}
          data-testid="button-show-register"
        >
          Criar Conta Corporativa
        </Button>
      </div>
    </div>
  );

  const VerificationScreen = () => (
    <div className="glass-effect rounded-3xl shadow-2xl p-8 w-full max-w-md animate-slide-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-nextest-green rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="text-white h-8 w-8" />
        </div>
        <h2 className="text-2xl font-semibold text-nextest-dark mb-2">Código Enviado</h2>
        <p className="text-gray-600 text-sm">Verifique seu email e digite o código de 6 dígitos</p>
        <p className="text-nextest-blue text-sm font-medium mt-1">{userEmail}</p>
      </div>

      <form onSubmit={verifyForm.handleSubmit(onVerify)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="code">Código de Verificação</Label>
          <Input
            id="code"
            placeholder="000000"
            maxLength={6}
            className="text-center text-2xl font-mono tracking-wider"
            {...verifyForm.register("code")}
            data-testid="input-verification-code"
          />
          {verifyForm.formState.errors.code && (
            <p className="text-sm text-red-500">{verifyForm.formState.errors.code.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full gradient-button text-white hover:scale-[1.02] transition-all duration-300"
          data-testid="button-verify"
        >
          Verificar Código
        </Button>
      </form>

      <div className="text-center mt-6">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentScreen('login')}
          data-testid="button-back-to-login"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao login
        </Button>
      </div>
    </div>
  );

  const RegisterScreen = () => (
    <div className="glass-effect rounded-3xl shadow-2xl p-8 w-full max-w-md animate-slide-up">
      <div className="text-center mb-8">
        <img 
          src="https://educanextest.com.br/wp-content/uploads/2024/04/Group-13Logo-Horizontal-Educa-SVG-Fix.svg" 
          alt="Educa Nextest Logo" 
          className="w-48 mx-auto mb-6 drop-shadow-sm"
        />
        <h2 className="text-2xl font-semibold text-nextest-dark mb-2">Criar Conta</h2>
        <p className="text-gray-600 text-sm">Apenas emails @nextest.com.br são permitidos</p>
      </div>

      <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome Completo</Label>
          <Input
            id="name"
            placeholder="Seu nome completo"
            {...registerForm.register("name")}
            data-testid="input-register-name"
          />
          {registerForm.formState.errors.name && (
            <p className="text-sm text-red-500">{registerForm.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="registerEmail">Email Corporativo</Label>
          <Input
            id="registerEmail"
            type="email"
            placeholder="seuemail@nextest.com.br"
            {...registerForm.register("email")}
            data-testid="input-register-email"
          />
          {registerForm.formState.errors.email && (
            <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Departamento</Label>
          <Select onValueChange={(value) => registerForm.setValue("department", value)}>
            <SelectTrigger data-testid="select-department">
              <SelectValue placeholder="Selecione o departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="engineering">Engenharia</SelectItem>
              <SelectItem value="sales">Vendas</SelectItem>
              <SelectItem value="support">Suporte</SelectItem>
              <SelectItem value="management">Gerência</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
          {registerForm.formState.errors.department && (
            <p className="text-sm text-red-500">{registerForm.formState.errors.department.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full gradient-button text-white hover:scale-[1.02] transition-all duration-300"
          data-testid="button-register"
        >
          <User className="mr-2 h-4 w-4" />
          Criar Conta
        </Button>
      </form>

      <div className="text-center mt-6">
        <Button 
          variant="ghost"
          onClick={() => setCurrentScreen('login')}
          data-testid="button-back-to-login-from-register"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao login
        </Button>
      </div>
    </div>
  );

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
      {currentScreen === 'login' && <LoginScreen />}
      {currentScreen === 'verification' && <VerificationScreen />}
      {currentScreen === 'register' && <RegisterScreen />}
    </div>
  );
}
