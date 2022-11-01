import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ParametersService } from '../parameters.service';
import { ShaderService } from '../shader.service';

@Component({
  selector: 'app-scene-canvas',
  templateUrl: './scene-canvas.component.html',
  styleUrls: ['./scene-canvas.component.css']
})
export class SceneCanvasComponent implements OnInit {
  @ViewChild('glCanvas') public canvas!: ElementRef
  didInit: boolean = false
  buffers: any
  points: number[] = []
  colors: number[] = []
  isDragging: boolean = false
  draggedIndex?: number

  constructor(private shaderService: ShaderService, private parametersService: ParametersService) {
    this.parametersService.refresh = () => {
      this.points = []
      this.colors = []
      var n = this.parametersService.pointCount
      for (let i = 0; i < n; i++) {
        this.points.push(Math.cos(2 * Math.PI * i / n))
        this.points.push(Math.sin(2 * Math.PI * i / n))
        
        var color = this.HSVtoRGB(i / n, 0.9, 1)
        this.colors.push(color.r)
        this.colors.push(color.g)
        this.colors.push(color.b)
      }
      this.main()
      this.parametersService.points = this.points
      this.parametersService.colors = this.colors
    }
  }

  ngOnInit(): void {
    this.parametersService.getURL()
  }

  ngAfterViewInit(): void {
    this.shaderService.getShaders().then(() => {
      this.didInit = true
      this.parametersService.refresh!()
    })
  }

  main() {
    const gl = this.canvas.nativeElement.getContext("webgl2")
    this.shaderService.gl = gl
    gl.getExtension("EXT_color_buffer_float")
    if (gl === null) {
      console.error("Unable to initialize WebGL")
      alert("Unable to initialize WebGL. Your browser or machine may not support it.")
      return
    }
    this.buffers = this.initBuffers(gl)
    const shaderProgram = this.shaderService.initShaderProgram(gl, this.shaderService.vertexSource, this.shaderService.fragmentSource)
    const programInfo = {
      program: shaderProgram,
      uniformLocations: {
        width: gl.getUniformLocation(shaderProgram, 'u_Width'),
        height: gl.getUniformLocation(shaderProgram, 'u_Height'),
        pointCount: gl.getUniformLocation(shaderProgram, 'u_PointCount'),
        points: gl.getUniformLocation(shaderProgram, 'u_Points'),
        colors: gl.getUniformLocation(shaderProgram, 'u_Colors'),
        coloring: gl.getUniformLocation(shaderProgram, 'u_Coloring')
      },
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'i_VertexPosition')
      }
    }
    const resizeCanvas = () => {
      // if (this.canvas.nativeElement.clientWidth < this.canvas.nativeElement.clientHeight) {
      //   this.canvas.nativeElement.width = this.canvas.nativeElement.clientWidth * 2
      //   this.canvas.nativeElement.height = this.canvas.nativeElement.clientWidth * 2
      // } else {
      //   this.canvas.nativeElement.width = this.canvas.nativeElement.clientHeight * 2
      //   this.canvas.nativeElement.height = this.canvas.nativeElement.clientHeight * 2
      // }
      this.canvas.nativeElement.width = this.canvas.nativeElement.clientWidth * 2
      this.canvas.nativeElement.height = this.canvas.nativeElement.clientHeight * 2
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
      this.drawScene(gl, programInfo)
    }
    resizeCanvas()
    window.addEventListener('resize', () => {
      resizeCanvas()
    })
    var render = () => {
      this.drawScene(gl, programInfo)
      // for (let i = 0; i < this.points.length; i++) {
      //   this.points[i] += (Math.random() * 2 - 1) * 0.001
      // }
      // requestAnimationFrame(render)
    }
    render()
    this.parametersService.draw = render
    this.canvas.nativeElement.addEventListener('mousemove', (event: any) => {
      this.onMouseMove(event)
      render()
    }, { passive: false })
    this.canvas.nativeElement.addEventListener('mousedown', (event: any) => {this.startDrag(event)})
    this.canvas.nativeElement.addEventListener('mouseup', (event: any) => {this.stopDrag(event)})
    this.canvas.nativeElement.addEventListener('mousecancel', (event: any) => {this.stopDrag(event)})
    this.canvas.nativeElement.addEventListener('mouseout', (event: any) => {this.stopDrag(event)})
    this.canvas.nativeElement.addEventListener('mouseleave', (event: any) => {this.stopDrag(event)})

    this.canvas.nativeElement.addEventListener('touchmove', (event: any) => {
      this.onMouseMove(event)
      render()
    }, { passive: false })
    this.canvas.nativeElement.addEventListener('touchstart', (event: any) => {this.startDrag(event)})
    this.canvas.nativeElement.addEventListener('touchend', (event: any) => {this.stopDrag(event)})
    this.canvas.nativeElement.addEventListener('touchcancel', (event: any) => {this.stopDrag(event)})
    this.canvas.nativeElement.addEventListener('touchout', (event: any) => {this.stopDrag(event)})
    this.canvas.nativeElement.addEventListener('touchleave', (event: any) => {this.stopDrag(event)})
  }

  positionToComplex(position: {x: number, y: number}): {x: number, y: number} {
    position.y = this.canvas.nativeElement.clientHeight - position.y
    var size = Math.min(this.canvas.nativeElement.clientWidth, this.canvas.nativeElement.clientHeight)
    var complexWidth = 3
    var complexeHeight = 3
    var z = {x: complexWidth * position.x / size - complexWidth / (2 / (this.canvas.nativeElement.clientWidth / size)),
             y: complexeHeight * position.y / size - complexeHeight / (2 / (this.canvas.nativeElement.clientHeight / size))}
    return z
  }

  onMouseMove(event: any) {
    event.preventDefault()
    if (this.isDragging) {
      var position = {x: 0, y: 0}
      if (event.touches) {
        if (event.touches.length > 0) {
          position = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
          }
        }
      } else {
        position = {
          x: event.x,
          y: event.y
        }
      }
      var complex = this.positionToComplex(position)
      if (this.draggedIndex != undefined) {
        this.points[this.draggedIndex] = complex.x
        this.points[this.draggedIndex + 1] = complex.y
      } else {
        for (let i = 0; i < this.points.length / 2; i++) {
          var dx = this.points[i * 2] - complex.x
          var dy = this.points[i * 2 + 1] - complex.y
          if (dx*dx + dy*dy < 0.004) {
            this.draggedIndex = 2 * i
            this.points[i * 2] = complex.x
            this.points[i * 2 + 1] = complex.y
            break
          }
        }
      }
      this.parametersService.points = this.points
      this.parametersService.colors = this.colors
    }
  }

  startDrag(event: any) {
    this.isDragging = true
  }

  stopDrag(event: any) {
    if (this.isDragging) {
      this.isDragging = false
      this.draggedIndex = undefined
    }
  }

  initBuffers(gl: WebGL2RenderingContext) {
    var positions: number[] = 
    [1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
      -1.0, -1.0]
    const corners = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, corners)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    return {
      corners: corners
    }
  }

  drawScene(gl: WebGL2RenderingContext, programInfo: any) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clearDepth(1.0)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.useProgram(programInfo.program)
    gl.uniform1f(programInfo.uniformLocations.width, gl.canvas.width)
    gl.uniform1f(programInfo.uniformLocations.height, gl.canvas.height)
    gl.uniform1i(programInfo.uniformLocations.pointCount, this.points.length / 2)
    gl.uniform2fv(programInfo.uniformLocations.points, this.points)
    gl.uniform3fv(programInfo.uniformLocations.colors, this.colors)
    gl.uniform1i(programInfo.uniformLocations.coloring, this.parametersService.coloring == 'uniform' ? 0 : (this.parametersService.coloring == 'smooth' ? 1 : 2))
    {
      const numComponents = 2
      const type = gl.FLOAT
      const normalize = false
      const stride = 0
      const offset = 0
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.corners)
      gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset)
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  HSVtoRGB(h: number, s: number, v: number): any {
    var r, g, b, i, f, p, q, t: number;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    if (r == undefined || g == undefined || b == undefined) {
      return
    }
    return {
        r: r,
        g: g,
        b: b
    };
  }
}
