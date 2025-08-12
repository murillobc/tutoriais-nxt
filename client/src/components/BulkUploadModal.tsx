
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle, User, Building, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportedClient {
  index: number;
  clientName: string;
  clientCpf: string;
  clientEmail: string;
  clientPhone?: string;
  companyName: string;
  companyDocument: string;
  companyRole: string;
  tutorialIds: string[];
  isValid: boolean;
  errors: string[];
}

interface Tutorial {
  id: string;
  name: string;
  description: string;
  tag: string;
}

interface BulkResult {
  successful: Array<{
    index: number;
    id: string;
    clientName: string;
    status: string;
  }>;
  failed: Array<{
    index: number;
    error: string;
    data: any;
  }>;
  total: number;
  message: string;
}

export function BulkUploadModal({ isOpen, onClose }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importedClients, setImportedClients] = useState<ImportedClient[]>([]);
  const [selectedTutorials, setSelectedTutorials] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<BulkResult | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'review' | 'results'>('upload');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tutorials = [] } = useQuery<Tutorial[]>({
    queryKey: ["/api/tutorials"],
    enabled: currentStep === 'review',
  });

  const uploadMutation = useMutation<BulkResult, Error, any[]>({
    mutationFn: async (releases: any[]): Promise<BulkResult> => {
      const response = await apiRequest("POST", "/api/tutorial-releases/bulk", { releases });
      return response as BulkResult;
    },
    onSuccess: (data: BulkResult) => {
      setResults(data);
      setCurrentStep('results');
      toast({
        title: "Upload concluído!",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tutorial-releases"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no upload",
        description: error.message || "Erro ao processar planilha",
        variant: "destructive",
      });
    },
  });

  const parseCSV = (csvData: string): ImportedClient[] => {
    const lines = csvData.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const client: any = { 
        index, 
        errors: [], 
        isValid: true,
        clientName: '',
        clientCpf: '',
        clientEmail: '',
        clientPhone: '',
        companyName: '',
        companyDocument: '',
        companyRole: '',
        tutorialIds: []
      };
      
      headers.forEach((header, headerIndex) => {
        const value = values[headerIndex] || '';
        
        switch (header.toLowerCase()) {
          case 'nome':
          case 'client_name':
            client.clientName = value;
            break;
          case 'cpf':
          case 'client_cpf':
            client.clientCpf = value;
            break;
          case 'email':
          case 'client_email':
            client.clientEmail = value;
            break;
          case 'telefone':
          case 'client_phone':
            client.clientPhone = value;
            break;
          case 'empresa':
          case 'company_name':
            client.companyName = value;
            break;
          case 'cnpj':
          case 'company_document':
            client.companyDocument = value;
            break;
          case 'cargo':
          case 'company_role':
            client.companyRole = value;
            break;
        }
      });

      // Validações
      if (!client.clientName) {
        client.errors.push('Nome é obrigatório');
        client.isValid = false;
      }
      if (!client.clientCpf || client.clientCpf.length < 11) {
        client.errors.push('CPF é obrigatório');
        client.isValid = false;
      }
      if (!client.clientEmail || !client.clientEmail.includes('@')) {
        client.errors.push('Email válido é obrigatório');
        client.isValid = false;
      }
      if (!client.companyName) {
        client.errors.push('Nome da empresa é obrigatório');
        client.isValid = false;
      }
      if (!client.companyDocument || client.companyDocument.length < 14) {
        client.errors.push('CNPJ é obrigatório');
        client.isValid = false;
      }
      if (!client.companyRole) {
        client.errors.push('Cargo é obrigatório');
        client.isValid = false;
      }
      
      return client;
    }).filter(client => client.clientName || client.clientEmail); // Filter out completely empty rows
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults(null);
      setCurrentStep('upload');
    }
  };

  const handleFileUpload = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvData = e.target?.result as string;
      const clients = parseCSV(csvData);
      setImportedClients(clients);
      setCurrentStep('review');
    };
    reader.readAsText(file);
  };

  const toggleTutorial = (tutorialId: string) => {
    const newSelection = selectedTutorials.includes(tutorialId)
      ? selectedTutorials.filter(id => id !== tutorialId)
      : [...selectedTutorials, tutorialId];
    setSelectedTutorials(newSelection);
  };

  const handleProcessReleases = () => {
    if (selectedTutorials.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um tutorial",
        variant: "destructive",
      });
      return;
    }

    const validClients = (importedClients || []).filter(client => client.isValid);
    const releases = validClients.map(client => ({
      ...client,
      tutorialIds: selectedTutorials
    }));

    uploadMutation.mutate(releases);
  };

  const downloadTemplate = () => {
    const template = `nome,cpf,email,telefone,empresa,cnpj,cargo
"João Silva","12345678901","joao@empresa.com","(11) 99999-9999","Empresa ABC","12345678000190","Tecnico"
"Maria Santos","98765432100","maria@empresa.com","(11) 88888-8888","Empresa XYZ","98765432000180","Gerente"`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-clientes-tutorial.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setFile(null);
    setImportedClients([]);
    setSelectedTutorials([]);
    setResults(null);
    setCurrentStep('upload');
    setSearchTerm("");
    onClose();
  };

  const filteredTutorials = tutorials.filter(
    tutorial =>
      tutorial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutorial.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validClientsCount = importedClients?.filter(client => client.isValid).length || 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-effect rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-white/20 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-nextest-dark">Upload em Lote</h2>
            <p className="text-gray-600 text-sm">
              {currentStep === 'upload' && 'Importe dados dos clientes via planilha CSV'}
              {currentStep === 'review' && 'Revise os dados e selecione os tutoriais'}
              {currentStep === 'results' && 'Resultados do processamento'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1: Upload */}
          {currentStep === 'upload' && (
            <>
              {/* Download Template */}
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Modelo da Planilha</h3>
                    <p className="text-sm text-blue-700">Baixe o modelo CSV para preenchimento (sem tutoriais)</p>
                  </div>
                </div>
                <Button onClick={downloadTemplate} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Modelo
                </Button>
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-nextest-dark">Selecionar Arquivo</h3>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-nextest-blue file:text-white hover:file:bg-nextest-blue/90"
                  />
                  <Button
                    onClick={handleFileUpload}
                    disabled={!file}
                    className="gradient-button text-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                </div>
                {file && (
                  <p className="text-sm text-gray-600">Arquivo selecionado: {file.name}</p>
                )}
              </div>
            </>
          )}

          {/* Step 2: Review */}
          {currentStep === 'review' && (
            <>
              {/* Client Data Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Total Importado</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-800">{importedClients?.length || 0}</p>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">Válidos</span>
                  </div>
                  <p className="text-2xl font-bold text-green-800">{validClientsCount}</p>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-900">Com Erros</span>
                  </div>
                  <p className="text-2xl font-bold text-red-800">{(importedClients?.length || 0) - validClientsCount}</p>
                </div>
              </div>

              {/* Tutorial Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-nextest-dark">Selecionar Tutoriais</h3>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar tutoriais por nome ou categoria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12"
                  />
                </div>

                {/* Selected Count */}
                {selectedTutorials.length > 0 && (
                  <div className="mb-4">
                    <span className="px-4 py-2 bg-nextest-green text-white rounded-full text-sm font-medium">
                      <Check className="inline h-4 w-4 mr-2" />
                      {selectedTutorials.length} tutorial{selectedTutorials.length !== 1 ? 'ais' : ''} selecionado{selectedTutorials.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {/* Tutorials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
                  {filteredTutorials.map((tutorial) => (
                    <div
                      key={tutorial.id}
                      className={`tutorial-card relative bg-white border-2 border-gray-200 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:border-nextest-blue hover:-translate-y-1 hover:shadow-lg ${
                        selectedTutorials.includes(tutorial.id) ? 'border-nextest-green bg-nextest-green/5' : ''
                      }`}
                      onClick={() => toggleTutorial(tutorial.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-nextest-dark text-sm">{tutorial.name}</h4>
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                          selectedTutorials.includes(tutorial.id)
                            ? 'bg-nextest-green border-nextest-green'
                            : 'border-gray-200'
                        }`}>
                          {selectedTutorials.includes(tutorial.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 text-xs mb-3 line-clamp-2">{tutorial.description}</p>
                      <span className="px-2 py-1 bg-nextest-blue/10 text-nextest-blue text-xs rounded-full">
                        {tutorial.tag}
                      </span>
                    </div>
                  ))}
                </div>

                {filteredTutorials.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhum tutorial encontrado</p>
                  </div>
                )}
              </div>

              {/* Client List Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-nextest-dark">Clientes Importados</h3>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                  {(importedClients || []).map((client, index) => (
                    <div key={index} className={`p-3 border-b border-gray-100 last:border-b-0 ${!client.isValid ? 'bg-red-50' : 'bg-white'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{client.clientName}</p>
                          <p className="text-xs text-gray-600">{client.clientEmail} • {client.companyName}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {client.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                      {!client.isValid && client.errors && client.errors.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-red-600">{client.errors.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
                <Button onClick={() => setCurrentStep('upload')} variant="outline">
                  Voltar
                </Button>
                <Button
                  onClick={handleProcessReleases}
                  disabled={uploadMutation.isPending || selectedTutorials.length === 0 || validClientsCount === 0}
                  className="gradient-button text-white"
                >
                  {uploadMutation.isPending ? "Processando..." : `Liberar para ${validClientsCount} cliente(s)`}
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Results */}
          {currentStep === 'results' && results && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-nextest-dark">Resultados do Processamento</h3>
              
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">Sucessos</span>
                  </div>
                  <p className="text-2xl font-bold text-green-800">{results.successful?.length || 0}</p>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-900">Erros</span>
                  </div>
                  <p className="text-2xl font-bold text-red-800">{results.failed?.length || 0}</p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-800">{results.total || 0}</p>
                </div>
              </div>

              {/* Errors Detail */}
              {results.failed && results.failed.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-900">Erros Detalhados:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {(results.failed || []).map((error, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-900">Cliente {error.index + 1}:</p>
                        <p className="text-sm text-red-700">{error.error}</p>
                        {error.data?.clientName && (
                          <p className="text-xs text-red-600">Cliente: {error.data.clientName}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <Button onClick={handleClose} variant="outline">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
