/* eslint-disable react-hooks/exhaustive-deps */
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.scss'
import { format } from 'date-fns'
import { useEffect } from 'react';
import worldTimestamp from 'world-timestamp'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export default function Home() {

    const geolocateInterval = 5000;
    const requestServerTimestampInterval = 60000;
    const timeZoneOffset = new Date().getTimezoneOffset() * 60000;

    const indicatorAniamtion = [
        [{ opacity: 1 }, { opacity: 0.2 }],
        { duration: 2500, easing: 'cubic-bezier(0.1, 0.5, 0.25, 1)' }
    ];

    let latitude, longitude;
    let localTimeDifference = 0;
    let calculatedLongitudeTimeDifference = 0;
    let lastCoordinates = null;

    const requestServerTimestamp = async () => {
        const timeRequestSent = performance.now();

        const timestamp = await worldTimestamp(); // "Etc/UTC"
        
        const requestTime = performance.now() - timeRequestSent;
        console.log(`A request sent to https://worldtimeapi.org/api/timezone/Etc/GMT took ${requestTime}ms.`);
        console.log(timestamp.response);

        const timestampMilliseconds = timestamp.milliseconds + requestTime / 2;
        localTimeDifference = timestampMilliseconds - Date.now();
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const codeElements = document.getElementsByClassName(styles.code);
        const indicatorElements = document.getElementsByClassName(styles.indicator);
        
        const geolocate = () => {
            navigator.geolocation.getCurrentPosition((position) => {
                [latitude, longitude] = [position.coords.latitude, position.coords.longitude];
                // // example coordinates (根室)
                // [latitude, longitude] = [43.33020420776925, 145.58282070797955];
                // // example coordinates (那覇)
                // [latitude, longitude] = [26.212162826250317, 127.67915499549518];

                calculatedLongitudeTimeDifference = longitude / 15 * 60 * 60 * 1000;
                codeElements[0].textContent = `${latitude}, ${longitude}`;
                indicatorElements[0].animate(...indicatorAniamtion);
                
                if (!lastCoordinates || lastCoordinates.longitude !== longitude || lastCoordinates.latitude !== latitude)
                    indicatorElements[1].animate(...indicatorAniamtion);
                if (!lastCoordinates)
                    requestServerTimestamp();
                
                lastCoordinates = {latitude, longitude};
            }, (error) => console.log(error));
        };

        geolocate();
        setInterval(geolocate, geolocateInterval);
        setInterval(requestServerTimestamp, requestServerTimestampInterval);

        const updateTimeText = () => {
            const now = Date.now();
            const calculatedDate = now + localTimeDifference + timeZoneOffset + calculatedLongitudeTimeDifference;

            codeElements[1].textContent = format(now, 'yyyy/MM/dd HH:mm:ss.SSS');
            codeElements[2].textContent = format(calculatedDate, 'yyyy/MM/dd HH:mm:ss.SSS');
            codeElements[3].textContent = (now > calculatedDate ? "-" : "+") + format(Math.abs(now - calculatedDate) + timeZoneOffset, 'HH:mm:ss.SSS');

            requestAnimationFrame(updateTimeText);
        }
        updateTimeText();
        
        // three.js
        const camera = new THREE.PerspectiveCamera(75);
        camera.position.set(0, 0, 2.5);
        camera.lookAt(0, 0, 0);

        const scene = new THREE.Scene();
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            canvas: document.getElementsByClassName(styles.canvas)[0],
        });

        const resize = () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }
        resize();
        
        const stage = new THREE.Object3D();
        const background = new THREE.Object3D();
        scene.add(stage);
        scene.add(background);

        const axisAngle = 23.4 * Math.PI / 180;
        const axisVector = new THREE.Vector3(Math.sin(axisAngle), Math.cos(axisAngle), 0);
        
        const animate = (time) => {
            const rad = time / 20000 * Math.PI / 2;
            stage.quaternion.setFromAxisAngle(axisVector, rad);
            background.quaternion.setFromAxisAngle(axisVector, rad * 0.8);

            renderer.render(scene, camera);
        }
        renderer.setAnimationLoop(animate);
        
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(
            '/icosphere_earth.glb',
            (gltf) => {
                const icosphere = gltf.scene.children[0];

                icosphere.scale.set(1, 1, 1);
                icosphere.material = new THREE.MeshNormalMaterial({
                    wireframe: true,
                });
                stage.add(icosphere.clone());

                icosphere.scale.set(2.5, 2.5, 2.5);
                icosphere.material = new THREE.MeshBasicMaterial({
                    color: 0xb0b0b0,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.4,
                });
                background.add(icosphere.clone());

                // const icospherePointsMaterial = new THREE.PointsMaterial({
                //     sizeAttenuation: true,
                //     size: 0.01,
                //     color: 0xffffff,
                // });
                // const icospherePoints = new THREE.Points(icosphere.geometry, icospherePointsMaterial);
                // stage.add(icospherePoints);

                console.log(icosphere);
            }, 
            (xhr) => {
                console.log(`${xhr.loaded / xhr.total * 100}% loaded`);
            },
            (error) => {
                console.error(error);
            }
        );

        window.addEventListener('resize', resize);
    }, [])

    return (
        <div className={styles.container}>
            <Head>
                <title>
                    themostaccurateclockyoucanget.com
                </title>
                <meta
                    name="description"
                    content="um i assume"
                />
                <link
                    rel="icon"
                    href="/favicon.ico"
                />
            </Head>

            <main className={styles.main}>
                <h1 className={styles.title}>
                    The Most Accurate Clock You Can Get
                </h1>

                <div className={styles.description}>
                    <div className={styles.topicContainer}>
                        <span className={styles.topicTitle}>
                            <span className={styles.indicator}></span>
                            Your coordinates:
                        </span>
                        <code className={styles.code}>locating...</code>
                    </div>
                    <div className={styles.topicContainer}>
                        <span className={styles.topicTitle}>
                            Your inaccurate clock:
                        </span>
                        <code className={styles.code}>...</code>
                    </div>
                    <div className={styles.topicContainer}>
                        <span className={styles.topicTitle}>
                            Your most accurate clock:
                        </span>
                        <code className={styles.code}>...</code>
                    </div>
                    <div className={styles.topicContainer}>
                        <span className={styles.topicTitle}>
                            <span className={styles.indicator}></span>
                            Difference:
                        </span>
                        <code className={styles.code}>...</code>
                    </div>
                </div>
            </main>

            <canvas className={styles.canvas}></canvas>
        </div>
    )
}
