import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Users, 
  UserPlus, 
  Shield, 
  UserMinus, 
  Search,
  Edit,
  Trash2,
  Crown,
  User as UserIcon,
  Building,
  Calendar,
  BarChart3
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
  creator?: {
    name: string;
    email: string;
  };
}

interface TutorialRelease {
  id: string;
  clientName: string;
  clientEmail: string;
  companyName: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

const createUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").refine(
    (email) => email.endsWith("@nextest.com.br"),
    "Email deve ser do domínio @nextest.com.br"
  ),
  department: z.string().min(1, "Departamento é obrigatório"),
  role: z.enum(["user", "admin"]),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type CreateUserData = z.infer<typeof createUserSchema>;

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Verificar se o usuário é admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center">
        <div className="glass-effect rounded-3xl p-8 text-center">
          <Crown className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-nextest-dark mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">Você não tem privilégios de administrador para acessar esta página.</p>
          <Link href="/">
            <Button className="gradient-button text-white">Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: allReleases = [], isLoading: releasesLoading } = useQuery<TutorialRelease[]>({
    queryKey: ["/api/admin/tutorial-releases"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const createUserForm = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: "user",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      return await apiRequest("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(userData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Usuário criado com sucesso!",
        description: "O novo usuário foi adicionado ao sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsCreateUserOpen(false);
      createUserForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Erro interno do servidor",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      return await apiRequest(`/api/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      toast({
        title: "Usuário atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message || "Erro interno do servidor",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Usuário removido com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover usuário",
        description: error.message || "Erro interno do servidor",
        variant: "destructive",
      });
    },
  });

  const handlePromoteUser = (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    updateUserMutation.mutate({
      userId,
      updates: { role: newRole },
    });
  };

  const handleToggleUserStatus = (userId: string, currentStatus: boolean) => {
    updateUserMutation.mutate({
      userId,
      updates: { isActive: !currentStatus },
    });
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-nextest-dark">Painel Administrativo</h1>
          <p className="text-gray-600">Gerenciar usuários e visualizar todas as liberações de tutoriais</p>
        </div>
        <Badge variant="secondary" className="bg-nextest-blue text-white">
          <Crown className="h-4 w-4 mr-1" />
          Administrador
        </Badge>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-nextest-blue" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-sm text-gray-600">Total de Usuários</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-nextest-green" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalAdmins}</p>
                  <p className="text-sm text-gray-600">Administradores</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalReleases}</p>
                  <p className="text-sm text-gray-600">Total de Liberações</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.releasesThisMonth}</p>
                  <p className="text-sm text-gray-600">Este Mês</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gestão de Usuários */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Gestão de Usuários</span>
              </CardTitle>
              <CardDescription>
                Criar, editar e gerenciar usuários do sistema
              </CardDescription>
            </div>
            <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-button text-white">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Adicione um novo usuário ao sistema
                  </DialogDescription>
                </DialogHeader>
                <Form {...createUserForm}>
                  <form onSubmit={createUserForm.handleSubmit((data) => createUserMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={createUserForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="João Silva" {...field} data-testid="input-user-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createUserForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="joao.silva@nextest.com.br" type="email" {...field} data-testid="input-user-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createUserForm.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departamento</FormLabel>
                          <FormControl>
                            <Input placeholder="Tecnologia" {...field} data-testid="input-user-department" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createUserForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input placeholder="Senha inicial" type="password" {...field} data-testid="input-user-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createUserForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Usuário</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-user-role">
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="user">Usuário Normal</SelectItem>
                              <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateUserOpen(false)}
                        data-testid="button-cancel-user"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createUserMutation.isPending}
                        className="gradient-button text-white"
                        data-testid="button-create-user"
                      >
                        {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Busca de usuários */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar usuários por nome, email ou departamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-users"
              />
            </div>
          </div>

          {/* Lista de usuários */}
          <div className="space-y-4">
            {usersLoading ? (
              <div className="text-center py-8">Carregando usuários...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {user.role === "admin" ? (
                            <Crown className="h-8 w-8 text-yellow-500" />
                          ) : (
                            <UserIcon className="h-8 w-8 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Building className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{user.department}</span>
                            <Badge 
                              variant={user.role === "admin" ? "default" : "secondary"}
                              className={user.role === "admin" ? "bg-yellow-500 text-white" : ""}
                            >
                              {user.role === "admin" ? "Admin" : "Usuário"}
                            </Badge>
                            <Badge variant={user.isActive ? "default" : "destructive"}>
                              {user.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          {user.creator && (
                            <p className="text-xs text-gray-400 mt-1">
                              Criado por: {user.creator.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePromoteUser(user.id, user.role)}
                          disabled={updateUserMutation.isPending}
                          data-testid={`button-toggle-role-${user.id}`}
                        >
                          {user.role === "admin" ? (
                            <>
                              <UserIcon className="h-4 w-4 mr-1" />
                              Rebaixar
                            </>
                          ) : (
                            <>
                              <Crown className="h-4 w-4 mr-1" />
                              Promover
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                          disabled={updateUserMutation.isPending}
                          data-testid={`button-toggle-status-${user.id}`}
                        >
                          {user.isActive ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteUserMutation.mutate(user.id)}
                          disabled={deleteUserMutation.isPending}
                          data-testid={`button-delete-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Todas as Liberações de Tutoriais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Todas as Liberações de Tutoriais</span>
          </CardTitle>
          <CardDescription>
            Visualização completa de todas as liberações criadas por todos os usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          {releasesLoading ? (
            <div className="text-center py-8">Carregando liberações...</div>
          ) : allReleases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma liberação encontrada
            </div>
          ) : (
            <div className="space-y-4">
              {allReleases.slice(0, 10).map((release) => (
                <Card key={release.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{release.clientName}</h4>
                        <p className="text-sm text-gray-600">{release.clientEmail}</p>
                        <p className="text-sm text-gray-500">{release.companyName}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={
                            release.status === 'success' ? 'default' :
                            release.status === 'pending' ? 'secondary' :
                            release.status === 'failed' ? 'destructive' : 'outline'
                          }
                        >
                          {release.status === 'success' ? 'Sucesso' :
                           release.status === 'pending' ? 'Pendente' :
                           release.status === 'failed' ? 'Falha' : 'Expirado'}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Criado por: {release.user.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(release.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {allReleases.length > 10 && (
                <div className="text-center text-sm text-gray-500">
                  Mostrando 10 de {allReleases.length} liberações
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}