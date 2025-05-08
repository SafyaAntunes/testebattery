
import { ComponentPropsWithoutRef } from "react";
import { SubAtividade, TipoServico, Prioridade } from "@/types/ordens";
import { Cliente } from "@/types/clientes";

export interface OrdemFormValues {
  id?: string;
  nome: string;
  clienteId: string;
  motorId?: string;
  dataAbertura?: Date;
  dataPrevistaEntrega?: Date;
  prioridade: Prioridade;
  servicosTipos: TipoServico[];
  servicosDescricoes: Record<TipoServico, string>;
  servicosSubatividades: Record<TipoServico, SubAtividade[]>;
  etapasTempoPreco?: Record<string, {
    precoHora?: number;
    tempoEstimado?: number;
  }>;
}

export interface OrdemFormProps extends ComponentPropsWithoutRef<"form"> {
  onSubmit: (data: any) => Promise<void> | void;
  isLoading?: boolean;
  defaultValues?: Partial<OrdemFormValues>;
  defaultFotosEntrada?: string[] | any[];
  defaultFotosSaida?: string[] | any[];
  onCancel?: () => void;
  onSubatividadeToggle?: (servicoTipo: string, subatividadeId: string, checked: boolean) => void;
  isSubatividadeEditingEnabled?: boolean;
  clientes?: Cliente[];
  isLoadingClientes?: boolean;
}
