import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ParametersService {
  pointCount = 3
  coloring: 'uniform' | 'smooth' | 'discrete' = 'smooth'
  points: number[] = []
  colors: number[] = []
  refresh?: () => void
  draw?: () => void

  constructor() { }
}
