import { FolderKanban, Plus } from "lucide-react";
import { motion } from "framer-motion";
import Button from "../../components/ui/Button";
import { useMotionPresets } from "../../components/ui/motion";
import "./ProjectsEmpty.css";

const steps = [
  "Crie o projeto e ligue a uma meta",
  "Adicione as tarefas com prazo",
  "O status e o progresso andam sozinhos",
];
export default function ProjectsEmpty({ onCreate }) {
  const presets = useMotionPresets();
  return (
    <motion.section
      className="projects-empty-card"
      variants={presets.card}
      aria-labelledby="projects-empty-title"
    >
      <span className="projects-empty-icon">
        <FolderKanban size={28} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h2 id="projects-empty-title">Nenhum projeto ainda</h2>
      <p>
        Projeto junta tarefas, prazo e cliente. Ligado a uma meta, ele empurra o
        progresso dela sozinho.
      </p>
      <Button icon={Plus} onClick={onCreate}>
        Criar primeiro projeto
      </Button>
      <ol>
        {steps.map((step, i) => (
          <li key={step}>
            <span aria-hidden="true">{i + 1}</span>
            {step}
          </li>
        ))}
      </ol>
    </motion.section>
  );
}
