import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

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

  constructor(private location: Location, private router: Router, private activatedRoute: ActivatedRoute) { }

  getURL() {
    this.activatedRoute.queryParamMap.subscribe((map: any) => {
      var params = map.params
      if (params['roots']) {
        this.pointCount = +params['roots']
      }
      if (params['color']) {
        this.coloring = params['color']
      }
    })
  }

  setURL() {
    var params: any = {
      roots: this.pointCount,
      color: this.coloring,
    }
    const url = this.router.createUrlTree([], {relativeTo: this.activatedRoute, queryParams: params}).toString()
    this.location.go(url);
  }
}
