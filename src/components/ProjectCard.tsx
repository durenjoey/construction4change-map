"use client";

import { Project, getTypeColor } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Building2 } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  compact?: boolean;
}

export function ProjectCard({ project, compact = false }: ProjectCardProps) {
  const typeColor = getTypeColor(project.type);
  const yearRange = project.startYear
    ? project.endYear
      ? `${project.startYear} - ${project.endYear}`
      : `${project.startYear} - Present`
    : "";

  if (compact) {
    return (
      <div className="w-[280px] rounded-lg bg-white shadow-lg border border-cfc-gray-light overflow-hidden">
        {project.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={project.partner}
            className="w-full h-[140px] object-cover"
          />
        ) : (
          <div className="h-1.5" style={{ backgroundColor: typeColor }} />
        )}
        <div className="p-4">
          <p className="font-bold text-sm text-cfc-slate leading-tight">
            {project.partner}
          </p>
          {project.details && (
            <p className="text-xs text-cfc-gray-mid mt-1">{project.details}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-cfc-gray-mid">
            {project.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {project.city}
                {project.country ? `, ${project.country}` : ""}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <Badge
              className="text-[10px] px-2 py-0 text-white border-0"
              style={{ backgroundColor: typeColor }}
            >
              {project.type}
            </Badge>
            {yearRange && (
              <span className="text-[10px] text-cfc-gray-mid flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {yearRange}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white border border-cfc-gray-light overflow-hidden hover:shadow-md transition-shadow">
      {project.imageUrl ? (
        <img
          src={project.imageUrl}
          alt={project.partner}
          className="w-full h-[160px] object-cover"
        />
      ) : (
        <div className="h-1" style={{ backgroundColor: typeColor }} />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-cfc-slate leading-tight truncate">
              {project.partner}
            </p>
            {project.details && (
              <p className="text-xs text-cfc-gray-mid mt-0.5 truncate">
                {project.details}
              </p>
            )}
          </div>
          <Badge
            className="text-[10px] px-2 py-0 shrink-0 text-white border-0"
            style={{ backgroundColor: typeColor }}
          >
            {project.type}
          </Badge>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-cfc-gray-mid">
          {project.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {project.city}
              {project.country ? `, ${project.country}` : ""}
            </span>
          )}
          {yearRange && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {yearRange}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
