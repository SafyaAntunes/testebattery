
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Servico } from "@/types/ordens";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { useServicoTracker } from "./hooks/useServicoTracker";
import ServicoHeader from "./ServicoHeader";
import ServicoDetails from "./ServicoDetails";
import ServicoControls from "./ServicoControls";
import TimerPausas from "../etapa/TimerPausas";

interface ServicoTrackerProps {
  servico: Servico;
  ordemId?: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  onSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  className?: string;
  etapa?: string;
}

export default function ServicoTracker({
  servico,
  ordemId = "",
  funcionarioId = "",
  funcionarioNome,
  onSubatividadeToggle,
  onServicoStatusChange,
  className,
  etapa,
}: ServicoTrackerProps) {
  const {
    isOpen,
    setIsOpen,
    temPermissao,
    isRunning,
    isPaused,
    displayTime,
    servicoStatus,
    progressPercentage,
    completedSubatividades,
    totalSubatividades,
    tempoTotalEstimado,
    subatividadesFiltradas,
    handleLoadFuncionarios,
    handleSubatividadeToggle,
    handleStartClick,
    handlePause,
    handleResume,
    handleFinish,
    handleMarcarConcluido,
    pausas,
  } = useServicoTracker({
    servico,
    ordemId,
    funcionarioId,
    funcionarioNome,
    etapa,
    onServicoStatusChange,
    onSubatividadeToggle
  });

  // Load funcionarios if needed (when the component mounts)
  useEffect(() => {
    handleLoadFuncionarios();
  }, [handleLoadFuncionarios]);

  // Verifica se todas subatividades selecionadas estão concluídas
  const todasSubatividadesConcluidas = subatividadesFiltradas.length === 0 || 
    (subatividadesFiltradas.length > 0 && subatividadesFiltradas.every(sub => sub.concluida));

  // Convert pausas for TimerPausas component format if needed
  const formattedPausas = pausas.map(p => ({
    inicio: p.iniciado,
    fim: p.finalizado,
    motivo: p.motivo
  }));

  return (
    <Card className={cn("w-full", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-6">
            <ServicoHeader 
              tipo={servico.tipo}
              displayTime={displayTime}
              servicoStatus={servicoStatus}
              progressPercentage={Number(progressPercentage)}
              completedSubatividades={completedSubatividades}
              totalSubatividades={totalSubatividades}
              tempoTotalEstimado={tempoTotalEstimado}
              funcionarioNome={servico.concluido ? servico.funcionarioNome : undefined}
              concluido={servico.concluido}
              temPermissao={temPermissao}
              isOpen={isOpen}
              onToggleOpen={() => setIsOpen(!isOpen)}
            />
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <ServicoDetails 
              descricao={servico.descricao}
              subatividades={subatividadesFiltradas}
              temPermissao={temPermissao}
              onSubatividadeToggle={handleSubatividadeToggle}
            />
            
            {/* Mostrar pausas mesmo quando o serviço está concluído */}
            {pausas && pausas.length > 0 && (
              <div className="py-2">
                <TimerPausas pausas={formattedPausas} />
              </div>
            )}
            
            <ServicoControls 
              isRunning={isRunning}
              isPaused={isPaused}
              temPermissao={temPermissao}
              concluido={servico.concluido}
              todasSubatividadesConcluidas={todasSubatividadesConcluidas}
              onStartClick={handleStartClick}
              onPauseClick={handlePause}
              onResumeClick={handleResume}
              onFinishClick={handleFinish}
              onMarcarConcluido={handleMarcarConcluido}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
