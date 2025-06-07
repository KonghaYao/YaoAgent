// 导入 Three.js 核心模块
import * as THREE from "three";
// 导入 OrbitControls 用于相机交互
import { OrbitControls } from "https://unpkg.com/three@0.165.0/examples/jsm/controls/OrbitControls.js";

// --- 1. 初始化场景、相机和渲染器 ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true }); // 启用抗锯齿
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 设置背景色 (黑色，模拟太空)
scene.background = new THREE.Color(0x000000);

// --- 2. 添加灯光 (太阳是唯一的发光体，所以这里用点光源模拟) ---
const pointLight = new THREE.PointLight(0xffffff, 2); // 颜色，强度
pointLight.position.set(0, 0, 0); // 放置在原点，与太阳位置重合
scene.add(pointLight);

// --- 3. 添加环境光 (可选，让阴影部分不至于完全黑暗) ---
const ambientLight = new THREE.AmbientLight(0x333333); // 柔和的白光
scene.add(ambientLight);

// --- 4. 创建纹理加载器 ---
const textureLoader = new THREE.TextureLoader();

// --- 5. 创建太阳 ---
const sunGeometry = new THREE.SphereGeometry(1.5, 32, 32); // 半径，分段数
const sunMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader.load("./textures/sun_texture.jpg"), // 太阳纹理
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// --- 6. 创建地球 (及公转轨道组) ---
const earthOrbit = new THREE.Object3D(); // 用于地球公转的组
scene.add(earthOrbit); // 将轨道组添加到场景中

const earthGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const earthMaterial = new THREE.MeshStandardMaterial({
    // StandardMaterial 更好，支持光照
    map: textureLoader.load("./textures/earth_texture.jpg"), // 地球纹理
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.position.set(5, 0, 0); // 距离太阳 5 个单位
earthOrbit.add(earth); // 将地球添加到地球轨道组中

// --- 7. 创建月球 (及公转轨道组) ---
const moonOrbit = new THREE.Object3D(); // 用于月球公转的组
earth.add(moonOrbit); // 将月球轨道组添加到地球上，让月球绕地球转

const moonGeometry = new THREE.SphereGeometry(0.15, 32, 32);
const moonMaterial = new THREE.MeshStandardMaterial({
    map: textureLoader.load("./textures/moon_texture.jpg"), // 月球纹理
});
const moon = new THREE.Mesh(moonGeometry, moonMaterial);
moon.position.set(1.5, 0, 0); // 距离地球 1.5 个单位
moonOrbit.add(moon); // 将月球添加到月球轨道组中

// --- 8. 相机位置 ---
camera.position.set(0, 10, 15);
camera.lookAt(0, 0, 0); // 视角看向中心

// --- 9. 添加轨道控制器 (用于用户交互，如旋转、缩放) ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 启用阻尼，使动画更平滑
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 3;
controls.maxDistance = 100;

// --- 10. 动画循环 ---
const animate = () => {
    requestAnimationFrame(animate);

    // 太阳自转
    sun.rotation.y += 0.005;

    // 地球公转 (绕太阳)
    earthOrbit.rotation.y += 0.008; // 调整公转速度

    // 地球自转
    earth.rotation.y += 0.01; // 调整自转速度

    // 月球公转 (绕地球)
    moonOrbit.rotation.y += 0.02; // 调整公转速度

    // 月球自转
    moon.rotation.y += 0.015;

    controls.update(); // 更新轨道控制器

    renderer.render(scene, camera);
};

animate();

// --- 11. 窗口大小调整处理 ---
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- 12. 绘制星空背景 (可选，增加沉浸感) ---
function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });

    const starVertices = [];
    for (let i = 0; i < 5000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
    }
    starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}
createStarfield();
