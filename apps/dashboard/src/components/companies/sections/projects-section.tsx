"use client";

import { CustomerProjectInput } from "@/app/(dashboard)/companies/actions";
import { ContractForProjectOption } from "@/app/(dashboard)/contracts/actions";
import { FolderOpen, Plus, X } from "lucide-react";

type Props = {
  projects: CustomerProjectInput[];
  removeProject: (index: number) => void;
  handleOpenProject: () => void;
  isPending: boolean;
  projectContracts: ContractForProjectOption[];
};

export const ProjectsSection = ({
  projects,
  removeProject,
  handleOpenProject,
  isPending,
  projectContracts,
}: Props) => (
  <section className="space-y-4">
    <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
      Projects
    </h2>
    <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
      {projects.map((project, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-muted-foreground">
              {project.projectName || "Project"}
            </span>
            {project.startingDate && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {project.startingDate}
                {project.endDate ? ` → ${project.endDate}` : ""}
              </span>
            )}
            {project.contractUuid && (
              <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                {projectContracts.find((c) => c.uuid === project.contractUuid)
                  ?.code ?? "Contract"}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => removeProject(index)}
            className="shrink-0 text-muted-foreground hover:text-destructive"
            disabled={isPending}
          >
            <X className="size-4" />
            <span className="sr-only">Remove project</span>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleOpenProject}
        className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        disabled={isPending}
      >
        <Plus className="size-4" />
        Add Project
      </button>
    </div>
  </section>
);
