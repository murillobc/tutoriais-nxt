import React from 'react';
import { SelectContent, SelectItem } from "@/components/ui/select";
import { useDepartments, useClientRoles } from "@/hooks/useJobRoles";

interface DynamicSelectContentProps {
  type: 'department' | 'client_role';
}

export function DynamicSelectContent({ type }: DynamicSelectContentProps) {
  const { data: departments, isLoading: loadingDepartments } = useDepartments();
  const { data: clientRoles, isLoading: loadingClientRoles } = useClientRoles();
  
  const roles = type === 'department' ? departments : clientRoles;
  const isLoading = type === 'department' ? loadingDepartments : loadingClientRoles;
  
  if (isLoading) {
    return (
      <SelectContent>
        <SelectItem value="loading" disabled>Carregando...</SelectItem>
      </SelectContent>
    );
  }
  
  if (!roles || roles.length === 0) {
    // Fallback para valores padrão se não houver dados no banco
    const defaultValues = type === 'department' 
      ? [
          { value: 'engineering', name: 'Engenharia' },
          { value: 'sales', name: 'Vendas' },
          { value: 'support', name: 'Suporte' },
          { value: 'management', name: 'Gerência' },
          { value: 'other', name: 'Outro' }
        ]
      : [
          { value: 'Desenvolvedor', name: 'Desenvolvedor' },
          { value: 'Gerente', name: 'Gerente' },
          { value: 'Analista', name: 'Analista' },
          { value: 'Outro', name: 'Outro' }
        ];
    
    return (
      <SelectContent>
        {defaultValues.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    );
  }
  
  return (
    <SelectContent>
      {roles.map((role) => (
        <SelectItem key={role.id} value={role.value}>
          {role.name}
        </SelectItem>
      ))}
    </SelectContent>
  );
}