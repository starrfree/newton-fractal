import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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

  constructor(private shaderService: ShaderService) {
    this.points.push(1)
    this.points.push(0)

    this.points.push(-1/2)
    this.points.push(Math.sqrt(3) / 2)

    this.points.push(-1/2)
    this.points.push(-Math.sqrt(3) / 2)


    this.colors.push(1)
    this.colors.push(0)
    this.colors.push(0)

    this.colors.push(0)
    this.colors.push(1)
    this.colors.push(0)

    this.colors.push(0)
    this.colors.push(0)
    this.colors.push(3)
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.shaderService.getShaders().then(() => {
      this.didInit = true
      this.main()
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
        colors: gl.getUniformLocation(shaderProgram, 'u_Colors')
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
    var render = () => {
      this.drawScene(gl, programInfo)
      // for (let i = 0; i < this.points.length; i++) {
      //   this.points[i] += (Math.random() * 2 - 1) * 0.001
      // }
      // requestAnimationFrame(render)
    }
    render()
    this.canvas.nativeElement.addEventListener('pointermove', (event: any) => {
      this.onMouseMove(event)
      render()
    })
    this.canvas.nativeElement.addEventListener('pointerdown', (event: any) => {this.startDrag(event)})
    this.canvas.nativeElement.addEventListener('pointerup', (event: any) => {this.stopDrag(event)})
    this.canvas.nativeElement.addEventListener('pointercancel', (event: any) => {this.stopDrag(event)})
    this.canvas.nativeElement.addEventListener('pointerout', (event: any) => {this.stopDrag(event)})
    this.canvas.nativeElement.addEventListener('pointerleave', (event: any) => {this.stopDrag(event)})
  }

  positionToComplex(position: {x: number, y: number}): {x: number, y: number} {
    return {
      x: position.x / this.canvas.nativeElement.width * 6 - 1.5,
      y: (1 - position.y / this.canvas.nativeElement.height) * 6 - 4.5
    }
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
          if (dx*dx + dy*dy < 0.002) {
            this.draggedIndex = 2 * i
            this.points[i * 2] = complex.x
            this.points[i * 2 + 1] = complex.y
            break
          }
        }
      }
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
    gl.uniform1i(programInfo.uniformLocations.pointCount, this.points.length)
    gl.uniform2fv(programInfo.uniformLocations.points, this.points)
    gl.uniform3fv(programInfo.uniformLocations.colors, this.colors)
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
}
