/* eslint-disable react-hooks/exhaustive-deps */
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.scss'
import crypto from 'crypto'
import { format } from 'date-fns'
import { useEffect } from 'react';
import { database } from '../utils/firebaseUtil'
import { ref, off, set, serverTimestamp, onChildAdded, onChildRemoved, onChildChanged, onDisconnect, startAfter } from 'firebase/database'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export default function Home() {

    const timeZoneOffset = new Date().getTimezoneOffset() * 60000;
    const indicatorAniamtion = [
        [
            { opacity: 1 },
            { opacity: 0.2 },
        ],
        {
            duration: 2500,
            easing: 'cubic-bezier(0.1, 0.5, 0.25, 1)',
        }
    ]
    let latitude, longitude;
    let localTimeDifference = 0;
    let calculatedLongitudeTimeDifference = 0;
    let lastCoordinates = null;

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const codeElements = document.getElementsByClassName(styles.code);
        const indicatorElements = document.getElementsByClassName(styles.indicator);

        const sessionId = crypto.randomBytes(9).toString('base64').replaceAll('/', '-').replaceAll('+', '_');
        codeElements[0].textContent = sessionId;

        const references = {
            root: ref(database, "/"),
            sessions: ref(database, `/sessions`),
            mysession: ref(database, `/sessions/${sessionId}`),
        };
    
        off(references.root);
        off(references.sessions);
        off(references.mysession);
    
        onChildChanged(references.mysession, (snapshot) => {
            const value = snapshot.val();
            // console.log(`child changed "${snapshot.key}":`, snapshot.val());
            if (snapshot.key === "timestamp" && value) {
                const dateUNIXtime = value;
                localTimeDifference = dateUNIXtime - Date.now();
            }
        });
        
        onDisconnect(references.mysession).remove();
    
        const requestServerTimestamp = () => {
            set(references.mysession, {
                timestamp: serverTimestamp(),
            })
        }
        
        const geolocate = () => {
            navigator.geolocation.getCurrentPosition((position) => {
                [latitude, longitude] = [position.coords.latitude, position.coords.longitude];

                calculatedLongitudeTimeDifference = longitude / 15 * 1000 * 60 * 60;
                codeElements[1].textContent = `${latitude}, ${longitude}`;
                indicatorElements[0].animate(...indicatorAniamtion);
                
                if (!lastCoordinates) {
                    indicatorElements[1].animate(...indicatorAniamtion);
                    requestServerTimestamp();
                } else if (lastCoordinates.longitude !== longitude) {
                    indicatorElements[1].animate(...indicatorAniamtion);
                }
                lastCoordinates = {latitude, longitude};
            }, (error) => console.log(error));
        };

        geolocate();
        setInterval(geolocate, 4000);

        const updateTimeText = () => {
            const now = Date.now();
            const calculatedDate = now + localTimeDifference + timeZoneOffset + calculatedLongitudeTimeDifference;

            codeElements[2].textContent = format(now, 'yyyy/MM/dd HH:mm:ss.SSS');
            codeElements[3].textContent = format(calculatedDate, 'yyyy/MM/dd HH:mm:ss.SSS');
            codeElements[4].textContent = (now > calculatedDate ? "-" : "+") + format(Math.abs(now - calculatedDate) + timeZoneOffset, 'HH:mm:ss.SSS');

            requestAnimationFrame(updateTimeText);
        }
        updateTimeText();

        
        // init
        const camera = new THREE.PerspectiveCamera(90);
        camera.position.set(0, 0, 2);
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
        scene.add(stage);

        const axisAngle = 23.4 * Math.PI / 180;
        const axisVector = new THREE.Vector3(Math.sin(axisAngle), Math.cos(axisAngle), 0);
        
        const animate = (time) => {
            const rad = time / 20000 * Math.PI / 2;
            stage.quaternion.setFromAxisAngle(axisVector, rad);

            renderer.render( scene, camera );
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
                stage.add(icosphere);

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
                <title>themostaccurateclockyoucanget.com</title>
                <meta name="description" content="um i assume" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <h1 className={styles.title}>
                    The Most Accurate Clock You Can Get
                </h1>

                <p className={styles.description}>
                    <span className={styles.topicBlock}>
                        Your session ID:
                    </span>
                    <code className={styles.code}>------------</code><br />
                    <span className={styles.topicBlock}>
                        <span className={styles.indicator}></span>
                        Your coordinates:
                    </span>
                    <code className={styles.code}>locating...</code><br />
                    <span className={styles.topicBlock}>
                        Your inaccurate clock:
                    </span>
                    <code className={styles.code}>...</code><br />
                    <span className={styles.topicBlock}>
                        Your most accurate clock:
                    </span>
                    <code className={styles.code}>...</code><br />
                    <span className={styles.topicBlock}>
                        <span className={styles.indicator}></span>
                        Difference:
                    </span>
                    <code className={styles.code}>...</code>
                </p>
            </main>

            <canvas className={styles.canvas}></canvas>
        </div>
    )
}
