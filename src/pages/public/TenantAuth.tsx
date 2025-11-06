import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tenant } from '@/hooks/useTenantRouter';
import { useTenantTheme } from '@/hooks/useTenantTheme';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { SignupDialog } from '@/components/auth/SignupDialog';
import { InterestDialog } from '@/components/auth/InterestDialog';
import { Sparkles, Mail, Lock, ArrowLeft, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface TenantAuthProps {
  tenant: Tenant;
}

export function TenantAuth({ tenant }: TenantAuthProps) {
  const config = tenant.tenant_config;
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showInterest, setShowInterest] = useState(false);

  // Aplicar tema do tenant
  useTenantTheme(tenant);

  const [loginData, setLoginData] = useState({ email: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(loginData.email, loginData.password);
      navigate(`/${tenant.slug}/chat`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login com Google');
      setIsLoading(false);
    }
  };

  const primaryColor = config?.primary_color || '#000000';
  const secondaryColor = config?.secondary_color || '#F59E0B';

  return (
    <>
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: config?.background_image_url 
            ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${config.background_image_url})`
            : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="w-full max-w-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/${tenant.slug}`)}
            className="mb-4 text-white hover:text-white/80"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <Card className="backdrop-blur-sm bg-background/95">
            <CardHeader className="text-center space-y-4">
              {config?.logo_url && (
                <img 
                  src={config.logo_url} 
                  alt={tenant.name} 
                  className="h-20 mx-auto object-contain"
                />
              )}
              <div>
                <CardTitle className="text-3xl mb-2">{tenant.name}</CardTitle>
                <CardDescription className="text-base">
                  Entre com suas credenciais para acessar o Chatbot do {tenant.name}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Formulário de Login */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email*</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha*</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                  style={{ backgroundColor: primaryColor }}
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>

              <Separator />

              {/* Link para Cadastro */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Não tem conta?{' '}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-semibold"
                    onClick={() => setShowSignup(true)}
                  >
                    Cadastre-se
                  </Button>
                </p>
              </div>

              {/* Aviso sobre Email */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Se você acabou de criar sua conta, verifique seu email para ativá-la antes de fazer login.
                </AlertDescription>
              </Alert>

              {/* Google Auth */}
              {config?.enable_google_auth && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">ou</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continuar com Google
                  </Button>
                </>
              )}

              <Separator />

              {/* Botão de Interesse */}
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Interessado no sistema?
                </p>
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => setShowInterest(true)}
                  style={{ backgroundColor: secondaryColor, color: 'white' }}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Cadastrar Interesse
                </Button>
              </div>
            </CardContent>

            <CardFooter className="text-center text-xs text-muted-foreground">
              © 2025 {tenant.name}
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <SignupDialog 
        open={showSignup} 
        onOpenChange={setShowSignup}
        tenantSlug={tenant.slug}
      />
      <InterestDialog 
        open={showInterest} 
        onOpenChange={setShowInterest}
        tenantName={tenant.name}
      />
    </>
  );
}
