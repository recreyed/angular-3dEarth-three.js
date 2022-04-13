import {  Component, ElementRef, ViewChild, HostListener, OnInit } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three-orbitcontrols-ts';

@Component({
    selector: 'scene',
    templateUrl: './scene.component.html',
    styleUrls: ['./scene.component.css']
})
export class SceneComponent implements OnInit {

    private renderer: THREE.WebGLRenderer;
    private camera: THREE.OrthographicCamera;
    public scene: THREE.Scene;
    public s = 200;//三维显示范围控制系数，系数越大，显示范围越大
    public controls: OrbitControls;
    public satellite: THREE.Points;

    @ViewChild('canvas')
    private canvasRef: ElementRef;

    constructor() {
        this.render = this.render.bind(this);
    }
    //获取canvas元素
    private get canvas(): HTMLCanvasElement {
        return this.canvasRef.nativeElement;
    }    
    // 计算v1,v2 的中点
    private getVCenter(v1, v2) {
        let v = v1.add(v2);
        return v.divideScalar(2);
    }
    // 计算V1，V2向量固定长度的点
    private getLenVcetor(v1, v2, len) {
        let v1v2Len = v1.distanceTo(v2);
        return v1.lerp(v2, len / v1v2Len);
    }
    // 根据经纬度获得三位坐标点
    lglt2xyz(lng, lat, radius) {
        const theta = (90 + lng) * (Math.PI / 180)
        const phi = (90 - lat) * (Math.PI / 180)
        return (new THREE.Vector3()).setFromSpherical(new THREE.Spherical(radius, phi, theta))
    }
    // 添加飞线
    private addLines(v0, v3) {       
        // 夹角
        var angle = (v0.angleTo(v3) * 1.8) / Math.PI / 0.1; // 0 ~ Math.PI
        var aLen = angle * 12,
            hLen = angle * angle * 12;
        var p0 = new THREE.Vector3(0, 0, 0);
        var vtop = new THREE.Vector3(0, 0, 0);
        // 法线向量
        var rayLine = new THREE.Ray(p0, this.getVCenter(v0.clone(), v3.clone()));
        // 顶点坐标
        rayLine.at(hLen / rayLine.at(1, rayLine.origin).length(), vtop);
        // 控制点坐标
        var v1 = this.getLenVcetor(v0.clone(), vtop, aLen);
        var v2 = this.getLenVcetor(v3.clone(), vtop, aLen);
        // 绘制贝塞尔曲线
        var curve = new THREE.CubicBezierCurve3(v0, v1, v2, v3);
        var gLine = new THREE.BufferGeometry();
        var gPoints = curve.getPoints(60);       
        gLine.setFromPoints(gPoints)
        var mLine = new THREE.LineBasicMaterial({
            color: 'violet',
        });
        return {
            curve: curve,
            lineMesh: new THREE.Line(gLine, mLine)
        };
    }

    // 创建场景
    private createScene() {
        this.scene = new THREE.Scene();
        var geometry = new THREE.SphereGeometry(130,40,40);//地球
        //卫星
        var p1 = new THREE.Vector3(200,0,0);
        const points = [p1];
        var satelliteGeometry = new THREE.BufferGeometry();
        satelliteGeometry.setFromPoints(points);
        // 贴图
        var loader = new THREE.TextureLoader();
        // 地球贴图
        var texture = loader.load('../../assets/images/earth3.jpg');
        var material = new THREE.MeshLambertMaterial({
            map:texture,//设置贴图属性值
        })
        var mesh = new THREE.Mesh(geometry,material)
            this.scene.add(mesh)
        // 卫星贴图
        loader.load('../../assets/images/moon.png',(texture)=>{
            var satelliteMaterial = new THREE.PointsMaterial({
                map:texture,
                transparent:true,
                size:20,
                depthWrite:false
            })
            this.satellite = new THREE.Points(satelliteGeometry,satelliteMaterial)
            this.scene.add(this.satellite)
            this.render();
        })
        // 飞线
        var lGroup = new THREE.Group();
        lGroup.add(this.addLines(this.lglt2xyz(116.20,39.56,130),this.lglt2xyz(-74.70,40.43,130)).lineMesh)
        this.scene.add(lGroup)
    }
    // 创建光源
    private createLight() {
        var light = new THREE.AmbientLight(0xffffff)
        this.scene.add(light);
    }
    // 创建相机
    private createCamera() {
        var k = window.innerWidth/window.innerHeight;//窗口宽高比
        this.camera = new THREE.OrthographicCamera(-this.s*k,this.s*k,this.s,-this.s,1,10000);
        this.camera.position.set(5,-20,200);
        this.camera.lookAt(this.scene.position);
    }
    // 渲染器设置
    private renderSetting() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        // document.body.appendChild(renderer.domElement); //body元素中插入canvas对象
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0xb9d3ff, 1);
        
    }
    // 渲染函数
    public render() {
        this.renderer.render(this.scene, this.camera);
        this.satellite.rotateY(0.01);
        requestAnimationFrame(this.render);
    }
    // 鼠标控制
    public addControls() {
        this.controls = new OrbitControls(this.camera,this.renderer.domElement);
    }

    // 窗口自适应
    @HostListener('window:resize', ['$event'])
    public onResize(event: Event) {
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.renderer.setSize(this.canvas.offsetWidth, this.canvas.offsetHeight);
        this.camera.updateProjectionMatrix();
    }
    ngOnInit() {
        this.createScene();
        this.createLight();
        this.createCamera();
        this.renderSetting();
        this.addControls();
    }

}