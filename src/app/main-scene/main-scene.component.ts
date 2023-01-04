import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { Pass } from 'three/examples/jsm/postprocessing/Pass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls';
import Stats from 'three/examples/jsm/libs/stats.module'
import { Observable, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators'



@Component({
  selector: 'app-main-scene',
  templateUrl: './main-scene.component.html',
  styleUrls: ['./main-scene.component.scss']
})
export class MainSceneComponent implements AfterViewInit, OnDestroy{
  @Input()
  toggleBloom$: Observable<boolean>;

  @ViewChild('sceneCanvas')
  private sceneCanvas: ElementRef<HTMLCanvasElement>;

  private readonly cameraZ = 1000;
  private readonly fieldOfView = 100;
  private readonly nearClippingPlane = 1;
  private readonly farClippingPlane = 1000;
  private readonly backgroundColor: THREE.Color = new THREE.Color(0x000000);
  private readonly textureLoader = new THREE.TextureLoader();
  private readonly clock = new THREE.Clock();
  private readonly stats: Stats = Stats();
  private FPS = 30;
  private controls: FlyControls;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private effectComposer: EffectComposer;

  private subs: Subscription[] = [];

  constructor() { 
    document.body.appendChild(this.stats.dom);
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => {
      sub.unsubscribe();
    })
  }
  
  private applyEvents() {
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.sceneCanvas.nativeElement.clientWidth, this.sceneCanvas.nativeElement.clientHeight),
      2,
      1,
      0.2
    );
    this.subs.push(this.toggleBloom$.pipe(
      tap((value) => {
        if (value) {
          this.effectComposer.addPass(bloomPass);
        }
        else {
          this.effectComposer.removePass(bloomPass);
        }
      })
    ).subscribe());
  }

  ngAfterViewInit(): void {
    this.createRenderer();
    this.createScene();
    this.applyEvents();
    this.render(); // creates loop
  }
  
  private createScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      this.fieldOfView,
      this.sceneCanvas.nativeElement.clientWidth / this.sceneCanvas.nativeElement.clientHeight,
      this.nearClippingPlane,
      this.farClippingPlane
    );
    this.camera.position.set(0, 0, this.cameraZ);
    this.effectComposer.addPass(new RenderPass(this.scene, this.camera));
    this.scene.background = this.backgroundColor;

    this.scene.add(this.createLightingSphere(0xf09200, 1.2, 0, 0, 500));
    this.scene.add(this.createMoon(-100, 0, 500));
    this.scene.add(this.createSphere(0xffffff, 100, 0, 500));

    this.controls = new FlyControls( this.camera, this.renderer.domElement );
    this.controls.movementSpeed = 100;
    this.controls.rollSpeed = Math.PI / 6;
    this.controls.autoForward = false;
		this.controls.dragToLook = true;
  }

  private createMoon(x = 1, y = 1, z = 100): THREE.Object3D {
    const texture = this.textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/lroc_color_poles_1k.jpg');
    const displacementMap = this.textureLoader.load( 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/ldem_3_8bit.jpg' );
    const material = new THREE.MeshPhongMaterial ({ 
      color: 0xffffff ,
      map: texture ,
      displacementMap: displacementMap,
      displacementScale: 0.06,
      bumpMap: displacementMap,
      bumpScale: 0.04,
      reflectivity:0, 
      shininess :0
    });
    const sphereGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(0.17, 16, 16);
    let sphere = new THREE.Mesh(sphereGeometry, material)
    sphere.position.set(x, y, z);
    return sphere;
  }

  private createSphere(color: number, x = 1, y = 1, z = 100): THREE.Object3D {
    const material: THREE.MeshLambertMaterial = new THREE.MeshLambertMaterial({color});
    const sphereGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(0.64, 16, 16);
    let sphere = new THREE.Mesh(sphereGeometry, material)
    sphere.position.set(x, y, z);
    return sphere;
  }

  private createLightingSphere(color: number, intensity = 1, x = 1, y = 1, z = 100): THREE.Object3D {
    const texture = this.textureLoader.load('assets/sun.jpg');
    const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
      //emissive: color,
      lightMapIntensity: intensity*3,
      color: color,
      roughness: 1,
      map: texture,
      //emissiveMap: texture,
      lightMap: texture
    });
    const sphereGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(70, 32, 32);
    let lightingSphere = new THREE.PointLight(color, intensity, 2000);
    lightingSphere.add(new THREE.Mesh(sphereGeometry, material))
    lightingSphere.position.set(x, y, z);
    return lightingSphere;
  }

  private createRenderer() {
    const width = this.sceneCanvas.nativeElement.clientWidth;
    const height = this.sceneCanvas.nativeElement.clientHeight;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.sceneCanvas.nativeElement, antialias: false });
    this.renderer.setPixelRatio(devicePixelRatio || 1);
    this.renderer.setSize(width, height);
    this.effectComposer = new EffectComposer(this.renderer);
    this.effectComposer.setSize(width, height);
    this.effectComposer.renderToScreen = true;
  }


  private render() {
    let component: MainSceneComponent = this;
    let delta = 0;
    let interval = 1 / this.FPS;
    (function render() {
      requestAnimationFrame( render );
      delta += component.clock.getDelta();

      if (delta  > interval) {
        component.controls.update(delta);
        component.effectComposer.render(delta);

        delta = delta % interval;
      }
      component.stats.update()
      
    }());
  }
}
