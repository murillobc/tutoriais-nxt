
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  const [results, setResults] = useState<BulkResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (csvData: string) => {
      const releases = parseCSV(csvData);
      return apiRequest("POST", "/api/tutorial-releases/bulk", { releases });
    },
    onSuccess: (data: BulkResult) => {
      setResults(data);
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

  const parseCSV = (csvData: string) => {
    const lines = csvData.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        switch (header.toLowerCase()) {
          case 'nome':
          case 'client_name':
            obj.clientName = value;
            break;
          case 'cpf':
          case 'client_cpf':
            obj.clientCpf = value;
            break;
          case 'email':
          case 'client_email':
            obj.clientEmail = value;
            break;
          case 'telefone':
          case 'client_phone':
            obj.clientPhone = value;
            break;
          case 'empresa':
          case 'company_name':
            obj.companyName = value;
            break;
          case 'cnpj':
          case 'company_document':
            obj.companyDocument = value;
            break;
          case 'cargo':
          case 'company_role':
            obj.companyRole = value;
            break;
          case 'tutoriais':
          case 'tutorial_ids':
            // Assuming tutorial IDs are separated by semicolons
            obj.tutorialIds = value.split(';').filter(id => id.trim());
            break;
        }
      });
      
      return obj;
    }).filter(obj => obj.clientName && obj.clientEmail); // Filter out empty rows
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvData = e.target?.result as string;
      uploadMutation.mutate(csvData);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = `nome,cpf,email,telefone,empresa,cnpj,cargo,tutoriais
"João Silva","12345678901","joao@empresa.com","(11) 99999-9999","Empresa ABC","12345678000190","Tecnico","tutorial-id-1;tutorial-id-2"
"Maria Santos","98765432100","maria@empresa.com","(11) 88888-8888","Empresa XYZ","98765432000180","Gerente","tutorial-id-3"`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-liberacao-tutoriais.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setFile(null);
    setResults(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-effect rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-white/20 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-nextest-dark">Upload em Lote</h2>
            <p className="text-gray-600 text-sm">Importe múltiplas liberações via planilha CSV</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Download Template */}
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">Modelo da Planilha</h3>
                <p className="text-sm text-blue-700">Baixe o modelo CSV para preenchimento</p>
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
                onClick={handleUpload}
                disabled={!file || uploadMutation.isPending}
                className="gradient-button text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadMutation.isPending ? "Processando..." : "Enviar"}
              </Button>
            </div>
            {file && (
              <p className="text-sm text-gray-600">Arquivo selecionado: {file.name}</p>
            )}
          </div>

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-nextest-dark">Resultados do Processamento</h3>
              
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">Sucessos</span>
                  </div>
                  <p className="text-2xl font-bold text-green-800">{results.successful.length}</p>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-900">Erros</span>
                  </div>
                  <p className="text-2xl font-bold text-red-800">{results.failed.length}</p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-800">{results.total}</p>
                </div>
              </div>

              {/* Errors Detail */}
              {results.failed.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-900">Erros Detalhados:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {results.failed.map((error, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-900">Linha {error.index + 2}:</p>
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
