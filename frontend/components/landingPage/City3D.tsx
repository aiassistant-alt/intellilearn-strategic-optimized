'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface City3DProps {
  className?: string
}

export default function City3D({ className = '' }: City3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    city: THREE.Object3D
    smoke: THREE.Object3D
    town: THREE.Object3D
    mouse: THREE.Vector2
    animationId: number
  } | null>(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Colores CognIA (azul en lugar de rojo)
    const setcolor = 0x3C31A3 // Color azul CognIA
    const backgroundColor = 0x132944 // Color azul oscuro CognIA

    // Configuración básica
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setClearColor(backgroundColor, 0.8)
    
    if (window.innerWidth > 800) {
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.shadowMap.needsUpdate = true
    }

    mountRef.current.appendChild(renderer.domElement)

    const camera = new THREE.PerspectiveCamera(
      20, 
      mountRef.current.clientWidth / mountRef.current.clientHeight, 
      1, 
      500
    )
    camera.position.set(0, 2, 14)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(backgroundColor)
    scene.fog = new THREE.Fog(setcolor, 10, 16)

    const city = new THREE.Object3D()
    const smoke = new THREE.Object3D()
    const town = new THREE.Object3D()

    const mouse = new THREE.Vector2()

    // Función para generar números aleatorios
    const mathRandom = (num = 8) => {
      return -Math.random() * num + Math.random() * num
    }

    // Función para alternar colores de edificios
    let setTintNum = true
    const setTintColor = () => {
      if (setTintNum) {
        setTintNum = false
        return 0x1a1a2e // Azul muy oscuro
      } else {
        setTintNum = true
        return 0x16213e // Azul oscuro alternativo
      }
    }

    // Crear la ciudad
    const init = () => {
      const segments = 2
      for (let i = 1; i < 100; i++) {
        const geometry = new THREE.BoxGeometry(1, 0, 0)
        const material = new THREE.MeshStandardMaterial({
          color: setTintColor(),
          wireframe: false
        })
        const wmaterial = new THREE.MeshLambertMaterial({
          color: 0xFFFFFF,
          wireframe: true,
          transparent: true,
          opacity: 0.03
        })

        const cube = new THREE.Mesh(geometry, material)
        const wire = new THREE.Mesh(geometry, wmaterial)
        const floor = new THREE.Mesh(geometry, material)
        const wfloor = new THREE.Mesh(geometry, wmaterial)

        cube.add(wfloor)
        cube.castShadow = true
        cube.receiveShadow = true
        cube.userData = { rotationValue: 0.1 + Math.abs(mathRandom(8)) }

        floor.scale.y = 0.05
        cube.scale.y = 0.1 + Math.abs(mathRandom(8))

        const cubeWidth = 0.9
        cube.scale.x = cube.scale.z = cubeWidth + mathRandom(1 - cubeWidth)
        cube.position.x = Math.round(mathRandom())
        cube.position.z = Math.round(mathRandom())

        floor.position.set(cube.position.x, 0, cube.position.z)

        town.add(floor)
        town.add(cube)
      }

      // Partículas
      const gmaterial = new THREE.MeshToonMaterial({ 
        color: 0x4A90E2, // Azul CognIA claro
        side: THREE.DoubleSide 
      })
      const gparticular = new THREE.CircleGeometry(0.01, 3)
      const aparticular = 5

      for (let h = 1; h < 300; h++) {
        const particular = new THREE.Mesh(gparticular, gmaterial)
        particular.position.set(
          mathRandom(aparticular),
          mathRandom(aparticular),
          mathRandom(aparticular)
        )
        particular.rotation.set(mathRandom(), mathRandom(), mathRandom())
        smoke.add(particular)
      }

      // Plano base
      const pmaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        side: THREE.DoubleSide,
        roughness: 0.9,
        metalness: 0.1,
        opacity: 0.9,
        transparent: true
      })
      const pgeometry = new THREE.PlaneGeometry(60, 60)
      const pelement = new THREE.Mesh(pgeometry, pmaterial)
      pelement.rotation.x = -90 * Math.PI / 180
      pelement.position.y = -0.001
      pelement.receiveShadow = true

      city.add(pelement)
    }

    // Crear líneas/coches
    let createCarPos = true
    const createCars = (cScale = 2, cPos = 20, cColor = 0x4A90E2) => {
      const cMat = new THREE.MeshToonMaterial({ 
        color: cColor, 
        side: THREE.DoubleSide 
      })
      const cGeo = new THREE.BoxGeometry(1, cScale / 40, cScale / 40)
      const cElem = new THREE.Mesh(cGeo, cMat)
      const cAmp = 3

      if (createCarPos) {
        createCarPos = false
        cElem.position.x = -cPos
        cElem.position.z = mathRandom(cAmp)
      } else {
        createCarPos = true
        cElem.position.x = mathRandom(cAmp)
        cElem.position.z = -cPos
        cElem.rotation.y = 90 * Math.PI / 180
      }

      cElem.receiveShadow = true
      cElem.castShadow = true
      cElem.position.y = Math.abs(mathRandom(5))
      city.add(cElem)
    }

    const generateLines = () => {
      for (let i = 0; i < 60; i++) {
        createCars(0.1, 20)
      }
    }

         // Luces más brillantes para mayor visibilidad
     const ambientLight = new THREE.AmbientLight(0xFFFFFF, 6)
     const lightFront = new THREE.SpotLight(0xFFFFFF, 30, 15)
     const lightBack = new THREE.PointLight(0xFFFFFF, 1.5)

    lightFront.rotation.x = 45 * Math.PI / 180
    lightFront.rotation.z = -45 * Math.PI / 180
    lightFront.position.set(5, 5, 5)
    lightFront.castShadow = true
    lightFront.shadow.mapSize.width = 6000
    lightFront.shadow.mapSize.height = lightFront.shadow.mapSize.width
    lightFront.penumbra = 0.1
    lightBack.position.set(0, 6, 0)

    smoke.position.y = 2

    scene.add(ambientLight)
    city.add(lightFront)
    scene.add(lightBack)
    scene.add(city)
    city.add(smoke)
    city.add(town)

    // Grid helper
    const gridHelper = new THREE.GridHelper(60, 120, 0x3C31A3, 0x000000)
    city.add(gridHelper)

    // Eventos del mouse
    const onMouseMove = (event: MouseEvent) => {
      if (!mountRef.current) return
      const rect = mountRef.current.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }

         // Función de animación
     const animate = () => {
       if (!sceneRef.current) return
       
       const uSpeed = 0.001
       
       city.rotation.y -= ((mouse.x * 8) - camera.rotation.y) * uSpeed
       city.rotation.x -= (-(mouse.y * 2) - camera.rotation.x) * uSpeed
       
       if (city.rotation.x < -0.05) city.rotation.x = -0.05
       else if (city.rotation.x > 1) city.rotation.x = 1

       smoke.rotation.y += 0.01
       smoke.rotation.x += 0.01

       camera.lookAt(city.position)
       renderer.render(scene, camera)
       
       sceneRef.current.animationId = requestAnimationFrame(animate)
     }

    // Manejar redimensionamiento
    const onWindowResize = () => {
      if (!mountRef.current) return
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    }

    // Inicializar
    generateLines()
    init()
    animate()

    // Event listeners
    window.addEventListener('mousemove', onMouseMove, false)
    window.addEventListener('resize', onWindowResize, false)

    // Guardar referencias
    sceneRef.current = {
      scene,
      camera,
      renderer,
      city,
      smoke,
      town,
      mouse,
      animationId: 0
    }

         // Cleanup
     return () => {
       window.removeEventListener('mousemove', onMouseMove)
       window.removeEventListener('resize', onWindowResize)
       
       if (sceneRef.current) {
         cancelAnimationFrame(sceneRef.current.animationId)
         if (mountRef.current && sceneRef.current.renderer.domElement) {
           try {
             mountRef.current.removeChild(sceneRef.current.renderer.domElement)
           } catch (error) {
             console.log('Element already removed')
           }
         }
         sceneRef.current.renderer.dispose()
         sceneRef.current = null
       }
     }
  }, [])

     return (
     <div 
       ref={mountRef} 
       className={`absolute inset-0 w-full h-full ${className}`}
       style={{ zIndex: 10, minHeight: '400px' }}
     />
   )
} 