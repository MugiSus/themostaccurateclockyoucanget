/* eslint-disable react-hooks/exhaustive-deps */
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.scss'
import crypto from 'crypto'
import { format } from 'date-fns'
import { useEffect } from 'react';
import { database } from '../utils/firebaseUtil'
import { ref, off, set, serverTimestamp, onChildAdded, onChildRemoved, onChildChanged, onDisconnect } from 'firebase/database'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { render } from 'react-dom';

export default function Home() {

    const indicatorAniamtion = {
        keyframes: [
            { opacity: 1 },
            { opacity: 0.2 },
        ],
        options: {
            duration: 2500,
            easing: 'cubic-bezier(0.1, 0.5, 0.25, 1)',
        }
    }
    const timeZoneOffset = new Date().getTimezoneOffset() * 60000;
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
                indicatorElements[0].animate(indicatorAniamtion.keyframes, indicatorAniamtion.options);
                
                if (!lastCoordinates) {
                    indicatorElements[1].animate(indicatorAniamtion.keyframes, indicatorAniamtion.options);
                    requestServerTimestamp();
                } else if (lastCoordinates.longitude !== longitude) {
                    indicatorElements[1].animate(indicatorAniamtion.keyframes, indicatorAniamtion.options);
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
        const camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.01, 10 );
        camera.position.z = 2;

        const scene = new THREE.Scene();
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            canvas: document.getElementsByClassName(styles.canvas)[0],
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(
            '/icosphere_earth.glb',
            (gltf) => {
                const model = gltf.scene.children[0];
                model.scale.set(1, 1, 1);
                model.material = new THREE.MeshNormalMaterial({
                    wireframe: true,
                });
                scene.add(model);
                console.log(model);

                renderer.setAnimationLoop((time) => {
                    model.rotation.x = time / 8000 * Math.PI;
                    model.rotation.y = time / 8000 * Math.PI;
        
                    renderer.render( scene, camera );
                });
            }, 
            undefined,
            (error) => {
                console.error(error);
            }
        );

        const light = new THREE.DirectionalLight(0xFFFFFF);
        light.intensity = 1;
        light.position.set(0.5, 0.5, 1);
        scene.add(light);

        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        });
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
                    <code className={styles.code}></code><br />
                    <span className={styles.topicBlock}>
                        Your most accurate clock:
                    </span>
                    <code className={styles.code}></code><br />
                    <span className={styles.topicBlock}>
                        <span className={styles.indicator}></span>
                        Difference:
                    </span>
                    <code className={styles.code}></code>
                </p>
            </main>

            <canvas className={styles.canvas}></canvas>
        </div>
    )
}
