import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ParametersService } from '../parameters.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit {
  @Output() escape = new EventEmitter()

  
  public get points() : {x: number, y: number}[] {
    var lst: {x: number, y: number}[] = []
    for (let i = 0; i < this.parametersService.points.length / 2; i++) {
      const x = this.parametersService.points[2 * i];
      const y = this.parametersService.points[2 * i + 1];
      lst.push({
        x: x,
        y: y
      })
    }
    return lst
  }
  

  constructor(public parametersService: ParametersService) { }

  ngOnInit(): void {
  }

  addPoint() {
    if (this.parametersService.pointCount < 7) {
      this.parametersService.pointCount += 1
      if (this.parametersService.refresh) {
        this.parametersService.refresh()
      }
      this.parametersService.setURL()
    }
  }

  removePoint() {
    if (this.parametersService.pointCount > 1) {
      this.parametersService.pointCount -= 1
      if (this.parametersService.refresh) {
        this.parametersService.refresh()
      }
      this.parametersService.setURL()
    }
  }

  getColor(index: number): string {
    return `rgb(${this.parametersService.colors[3 * index] * 255}, ${this.parametersService.colors[3 * index + 1] * 255}, ${this.parametersService.colors[3 * index + 2] * 255})`
  }

  setColoring(coloring: "uniform" | "smooth" | "discrete") {
    this.parametersService.coloring = coloring
    if (this.parametersService.draw) {
      this.parametersService.draw()
    }
    this.parametersService.setURL()
  }
}
