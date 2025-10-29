import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, ArrowLeft, Key, Eye, EyeOff, Lock } from "lucide-react";
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
  ),
  password: z.string().min(1, "Senha é obrigatória")
});

const registerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").refine(
    email => email.endsWith('@nextest.com.br'),
    "Email deve ser do domínio @nextest.com.br"
  ),
  department: z.string().min(1, "Departamento é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido").refine(
    email => email.endsWith('@nextest.com.br'),
    "Email deve ser do domínio @nextest.com.br"
  )
});

const resetPasswordSchema = z.object({
  code: z.string().length(6, "Código deve ter 6 dígitos"),
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

type Screen = 'login' | 'register' | 'forgot-password' | 'reset-password';

export default function Login() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [userEmail, setUserEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const { login, register, forgotPassword, resetPassword } = useAuth();
  const { toast } = useToast();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { 
      email: '',
      password: ''
    }
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { 
      name: '', 
      email: '', 
      department: '', 
      password: '',
      confirmPassword: ''
    }
  });

  const forgotPasswordForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' }
  });

  const resetPasswordForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { 
      code: '', 
      newPassword: '', 
      confirmPassword: '' 
    }
  });

  const onLogin = async (data: LoginForm) => {
    try {
      const response = await login({
        email: data.email,
        password: data.password
      });
      
      toast({
        title: "Login realizado!",
        description: "Bem-vindo ao Portal de Tutoriais."
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const onRegister = async (data: RegisterForm) => {
    try {
      await register({
        name: data.name,
        email: data.email,
        department: data.department,
        password: data.password,
        confirmPassword: data.confirmPassword
      });
      toast({
        title: "Conta criada!",
        description: "Agora você pode fazer login com sua senha."
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

  const onForgotPassword = async (data: ForgotPasswordForm) => {
    try {
      const response = await forgotPassword({ email: data.email });
      setUserEmail(data.email);
      setCurrentScreen('reset-password');
      toast({
        title: "Código enviado!",
        description: response.debugCode ? 
          `Código: ${response.debugCode} (problema com email)` : 
          "Verifique seu email para o código de redefinição."
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const onResetPassword = async (data: ResetPasswordForm) => {
    try {
      await resetPassword({
        email: userEmail,
        code: data.code,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      });
      toast({
        title: "Senha redefinida!",
        description: "Agora você pode fazer login com sua nova senha."
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
          src="/../logo-educa-nxt.png" 
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <button
              type="button"
              onClick={() => setCurrentScreen('forgot-password')}
              className="text-sm text-nextest-blue hover:text-nextest-dark transition-colors"
              data-testid="button-forgot-password"
            >
              Esqueci minha senha
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
              {...loginForm.register("password")}
              data-testid="input-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              data-testid="button-toggle-password"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {loginForm.formState.errors.password && (
            <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full gradient-button text-white hover:scale-[1.02] transition-all duration-300"
          data-testid="button-login"
        >
          <Key className="mr-2 h-4 w-4" />
          Entrar com Senha
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

        {/* Password Fields */}
        <div className="space-y-4 pt-2 border-t border-gray-200">
          <div className="text-center">
            <Label className="text-sm text-gray-600">Senha</Label>
            <p className="text-xs text-gray-500 mt-1">Crie uma senha para sua conta</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="registerPassword">Senha</Label>
            <div className="relative">
              <Input
                id="registerPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                {...registerForm.register("password")}
                data-testid="input-register-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                data-testid="button-toggle-register-password"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {registerForm.formState.errors.password && (
              <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repita a senha"
                {...registerForm.register("confirmPassword")}
                data-testid="input-confirm-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                data-testid="button-toggle-confirm-password"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {registerForm.formState.errors.confirmPassword && (
              <p className="text-sm text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>
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

  const ForgotPasswordScreen = () => (
    <div className="glass-effect rounded-3xl shadow-2xl p-8 w-full max-w-md animate-slide-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-nextest-blue rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="text-white h-8 w-8" />
        </div>
        <h2 className="text-2xl font-semibold text-nextest-dark mb-2">Esqueci minha Senha</h2>
        <p className="text-gray-600 text-sm">Digite seu email para receber um código de redefinição</p>
      </div>

      <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="forgot-email">Email Corporativo</Label>
          <Input
            id="forgot-email"
            type="email"
            placeholder="seuemail@nextest.com.br"
            {...forgotPasswordForm.register("email")}
            data-testid="input-forgot-email"
          />
          {forgotPasswordForm.formState.errors.email && (
            <p className="text-sm text-red-500">{forgotPasswordForm.formState.errors.email.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full gradient-button text-white hover:scale-[1.02] transition-all duration-300"
          data-testid="button-send-reset-code"
        >
          <Lock className="mr-2 h-4 w-4" />
          Enviar Código de Redefinição
        </Button>
      </form>

      <div className="text-center mt-6">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentScreen('login')}
          data-testid="button-back-to-login-from-forgot"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao login
        </Button>
      </div>
    </div>
  );

  const ResetPasswordScreen = () => (
    <div className="glass-effect rounded-3xl shadow-2xl p-8 w-full max-w-md animate-slide-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-nextest-green rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="text-white h-8 w-8" />
        </div>
        <h2 className="text-2xl font-semibold text-nextest-dark mb-2">Redefinir Senha</h2>
        <p className="text-gray-600 text-sm">Digite o código enviado e sua nova senha</p>
        <p className="text-nextest-blue text-sm font-medium mt-1">{userEmail}</p>
      </div>

      <form onSubmit={resetPasswordForm.handleSubmit(onResetPassword)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="reset-code">Código de Verificação</Label>
          <Input
            id="reset-code"
            placeholder="000000"
            maxLength={6}
            className="text-center text-2xl font-mono tracking-wider"
            {...resetPasswordForm.register("code")}
            data-testid="input-reset-code"
          />
          {resetPasswordForm.formState.errors.code && (
            <p className="text-sm text-red-500">{resetPasswordForm.formState.errors.code.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-password">Nova Senha</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              {...resetPasswordForm.register("newPassword")}
              data-testid="input-new-password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              data-testid="button-toggle-new-password"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {resetPasswordForm.formState.errors.newPassword && (
            <p className="text-sm text-red-500">{resetPasswordForm.formState.errors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
          <div className="relative">
            <Input
              id="confirm-new-password"
              type={showConfirmNewPassword ? "text" : "password"}
              placeholder="Repita a nova senha"
              {...resetPasswordForm.register("confirmPassword")}
              data-testid="input-confirm-new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              data-testid="button-toggle-confirm-new-password"
            >
              {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {resetPasswordForm.formState.errors.confirmPassword && (
            <p className="text-sm text-red-500">{resetPasswordForm.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full gradient-button text-white hover:scale-[1.02] transition-all duration-300"
          data-testid="button-confirm-reset"
        >
          <Key className="mr-2 h-4 w-4" />
          Redefinir Senha
        </Button>
      </form>

      <div className="text-center mt-6">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentScreen('forgot-password')}
          data-testid="button-back-to-forgot"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
      {/* Debug indicator */}
      <div className="fixed top-4 right-4 bg-black text-white px-3 py-1 rounded text-xs">
        Tela: {currentScreen}
      </div>
      
      {currentScreen === 'login' && <LoginScreen />}
      {currentScreen === 'register' && <RegisterScreen />}
      {currentScreen === 'forgot-password' && <ForgotPasswordScreen />}
      {currentScreen === 'reset-password' && <ResetPasswordScreen />}
    </div>
  );
}
