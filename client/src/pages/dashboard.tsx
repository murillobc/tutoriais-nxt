import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Download,
  Search,
  LogOut,
  ClipboardList,
  Calendar,
  PlayCircle,
  Building,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { TutorialReleaseModal } from "@/components/TutorialReleaseModal";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BulkUploadModal } from "@/components/BulkUploadModal";


interface TutorialRelease {
  id: string;
  clientName: string;
  clientCpf: string;
  clientEmail: string;
  clientPhone?: string;
  companyName: string;
  companyDocument: string;
  companyRole: string;
  tutorialIds: string[];
  status: string;
  expirationDate?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const { data: releases = [], isLoading, refetch: refetchReleases } = useQuery<TutorialRelease[]>({
    queryKey: ["/api/tutorial-releases"],
  });

  const { data: tutorials = [] } = useQuery({
    queryKey: ["/api/tutorials"],
  });



  const filteredReleases = releases.filter(release => {
    const matchesSearch =
      release.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      release.clientCpf.includes(searchTerm) ||
      release.companyName.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = false;

    if (statusFilter === "all") {
      matchesStatus = true;
    } else if (statusFilter === "success") {
      // Para 'success', verificar se não está expirado
      matchesStatus = release.status === 'Sucesso' &&
                     !!release.expirationDate &&
                     new Date(release.expirationDate) > new Date();
    } else if (statusFilter === "expired") {
      // Para 'expired', verificar se era 'Sucesso' mas já expirou
      matchesStatus = release.status === 'Sucesso' &&
                     !!release.expirationDate &&
                     new Date(release.expirationDate) <= new Date();
    } else {
      matchesStatus = release.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: releases.length,
    thisMonth: releases.filter(r => {
      const releaseDate = new Date(r.createdAt);
      const now = new Date();
      const saoPauloReleaseDate = new Date(releaseDate.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      const saoPauloNow = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      return saoPauloReleaseDate.getMonth() === saoPauloNow.getMonth() && saoPauloReleaseDate.getFullYear() === saoPauloNow.getFullYear();
    }).length,
    active: releases.filter(r => {
      if (r.status !== 'Sucesso') return false;
      if (!r.expirationDate) return false;
      const now = new Date();
      const expDate = new Date(r.expirationDate);
      return expDate > now;
    }).length,
    companies: Array.from(new Set(releases.map(r => r.companyName))).length
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      expired: "bg-red-100 text-red-800",
      success: "bg-green-100 text-green-800",
      Sucesso: "bg-green-100 text-green-800", // Status em português
      failed: "bg-red-100 text-red-800"
    };

    const statusLabels = {
      active: "Ativo",
      pending: "Pendente",
      expired: "Expirado",
      success: "Sucesso",
      Sucesso: "Sucesso", // Status em português
      failed: "Falha"
    };

    return (
      <span className={`px-3 py-1 text-xs rounded-full font-medium ${statusClasses[status as keyof typeof statusClasses]}`}>
        {statusLabels[status as keyof typeof statusLabels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTutorialNames = (tutorialIds: string[]) => {
    const tutorialList = Array.isArray(tutorials) ? tutorials : [];
    const names = tutorialIds.map(id => {
      const tutorial = tutorialList.find((t: any) => t.id === id);
      return tutorial ? tutorial.name : id;
    });
    return names.join(', ');
  };





  const generateExcelReport = async () => {
    try {
      if (!user?.id) {
        toast({
          title: "Erro",
          description: "Usuário não identificado. Faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/reports/tutorial-releases?userId=${user.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) throw new Error("Erro ao buscar dados do relatório");

      const data = await response.json();

      const filteredData = data;

      // Importar dinamicamente XLSX
      const XLSX = await import('xlsx');

      // Preparar dados para Excel
      const worksheetData = [
        ['Cliente', 'CPF', 'Email', 'Empresa', 'CNPJ', 'Cargo', 'Status', 'Data Criação', 'Data Expiração', 'Responsável']
      ];

      filteredData.forEach((release: any) => {
        worksheetData.push([
          release.clientName,
          release.clientCpf,
          release.clientEmail,
          release.companyName,
          release.companyDocument,
          release.companyRole,
          release.status === 'success' ? 'Sucesso' :
          release.status === 'pending' ? 'Pendente' :
          release.status === 'failed' ? 'Falha' : 'Expirado',
          formatDate(release.createdAt),
          release.expirationDate ? formatDate(release.expirationDate) : 'N/A',
          release.user?.name || 'N/A'
        ]);
      });

      // Criar workbook e worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório Tutoriais');

      // Salvar arquivo
      XLSX.writeFile(workbook, 'relatorio-tutoriais.xlsx');
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      alert('Erro ao gerar relatório Excel');
    }
  };

  return (
    <div className="gradient-bg min-h-screen">
      {/* Navigation Header */}
      <nav className="glass-effect border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <img
                src="https://educanextest.com.br/wp-content/uploads/2024/04/Group-13Logo-Horizontal-Educa-SVG-Fix.svg"
                alt="Logo"
                className="h-8"
              />
              <h1 className="text-xl font-semibold text-nextest-dark">Portal de Tutoriais</h1>
            </div>

            <div className="flex items-center space-x-4">
              {user && (
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <span>{user.name}</span>
                    <span className="text-gray-400">|</span>
                    <span>{user.email}</span>
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Liberações</p>
                <p className="text-2xl font-semibold text-nextest-dark" data-testid="stat-total">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-nextest-blue rounded-lg flex items-center justify-center">
                <ClipboardList className="text-white h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Este Mês</p>
                <p className="text-2xl font-semibold text-nextest-dark" data-testid="stat-month">{stats.thisMonth}</p>
              </div>
              <div className="w-12 h-12 bg-nextest-green rounded-lg flex items-center justify-center">
                <Calendar className="text-white h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tutoriais Concluídos</p>
                <p className="text-2xl font-semibold text-nextest-dark" data-testid="stat-active">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-nextest-light-blue rounded-lg flex items-center justify-center">
                <PlayCircle className="text-white h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Empresas Atendidas</p>
                <p className="text-2xl font-semibold text-nextest-dark" data-testid="stat-companies">{stats.companies}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                <Building className="text-white h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex space-x-3">
            <Button
              onClick={() => setIsBulkModalOpen(true)}
              variant="outline"
              className="border-nextest-blue text-nextest-blue hover:bg-nextest-blue hover:text-white transition-colors"
              data-testid="button-bulk-upload"
            >
              <Download className="mr-2 h-4 w-4" />
              Upload em Lote
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="gradient-button text-white hover:scale-[1.02] transition-all duration-300"
              data-testid="button-new-release"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Liberação
            </Button>
          </div>
        </div>

        {/* Recent Releases Section */}
        <div className="glass-card rounded-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-nextest-dark">Liberações Recentes</h2>
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, CPF ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-80 pl-10 bg-white/50"
                  data-testid="input-search"
                />
              </div>

              {/* Filter Dropdown */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-white/50" data-testid="select-status-filter">
                  <SelectValue placeholder="Todos os Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="expired">Expirados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="failed">Falha</SelectItem>
                </SelectContent>
              </Select>

              {/* Report Buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateExcelReport}
                  className="bg-white/50"
                  data-testid="button-export-excel"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          </div>

          {/* Releases Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="loading-spinner"></div>
                <p className="ml-3 text-gray-600">Carregando liberações...</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Empresa</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tutoriais</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Data Criação</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReleases.map((release) => (
                    <tr key={release.id} className="hover:bg-gray-50/50 transition-colors" data-testid={`row-release-${release.id}`}>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-nextest-dark">{release.clientName}</p>
                          <p className="text-sm text-gray-600">{release.clientEmail}</p>
                          <p className="text-xs text-gray-500">{release.clientCpf}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-sm font-medium">{release.companyName}</p>
                          <p className="text-xs text-gray-500">{release.companyDocument || 'CNPJ não informado'}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-700">
                          {getTutorialNames(release.tutorialIds)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-600">{formatDate(release.createdAt)}</p>
                        <p className="text-xs text-gray-500">{formatTime(release.createdAt)}</p>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(release.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!isLoading && filteredReleases.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma liberação encontrada</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && filteredReleases.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Mostrando 1-{Math.min(10, filteredReleases.length)} de {filteredReleases.length} resultados
              </p>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" disabled data-testid="button-prev-page">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button size="sm" className="bg-nextest-blue text-white">1</Button>
                <Button variant="ghost" size="sm" data-testid="button-next-page">
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tutorial Release Modal */}
      <TutorialReleaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
      />
    </div>
  );
}