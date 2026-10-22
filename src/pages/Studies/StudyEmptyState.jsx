import { GraduationCap, Layers, Plus } from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import "./StudyEmptyState.css";

export default function StudyEmptyState({ content = false, onCreate }) {
  const steps = content
    ? [
        "Crie os módulos do curso",
        "Cole as aulas, uma por linha",
        "Marque o que concluir: o progresso anda sozinho",
      ]
    : [
        "Crie o estudo e escolha o tipo",
        "Monte módulos e aulas (dá para colar vários)",
        "Agende aulas: elas caem nas Tarefas com o pomodoro",
      ];
  return (
    <EmptyState
      className="studies-first-empty"
      icon={content ? Layers : GraduationCap}
      title={content ? "Comece pelo primeiro módulo" : "Nenhum estudo ainda"}
      description={
        content
          ? "Dentro dele entram sub-módulos, matérias e aulas. Qualquer um pode ser agendado para as Tarefas."
          : "Cadastre um curso, a faculdade, uma mentoria ou um livro e organize em módulos e aulas."
      }
    >
      <Button icon={Plus} onClick={onCreate}>
        {content ? "Criar módulo" : "Criar primeiro estudo"}
      </Button>
      <ol className="studies-empty-steps" aria-label="Como funciona">
        {steps.map((step, index) => (
          <li key={step}>
            <span>{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>
    </EmptyState>
  );
}
