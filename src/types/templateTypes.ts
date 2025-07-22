
import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface BaseTemplate {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export interface DepartmentTemplate extends BaseTemplate {
  positions: string[];
  responsibilities: string[];
}

export interface PositionTemplate extends BaseTemplate {
  department?: string;
  responsibilities: string[];
  requirements: string[];
  level: 'junior' | 'pleno' | 'senior' | 'manager';
}

export interface TeamTemplate extends BaseTemplate {
  department?: string;
  defaultRoles: string[];
  goals: string[];
  structure: 'hierarchical' | 'flat' | 'matrix';
}
