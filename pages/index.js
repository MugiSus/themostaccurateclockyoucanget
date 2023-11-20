/* eslint-disable react-hooks/exhaustive-deps */
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.scss";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import worldTimestamp from "world-timestamp";
import * as THREE from "three";
import useRequestAnimationFrame from "beautiful-react-hooks/useRequestAnimationFrame";
import useInterval from "beautiful-react-hooks/useInterval";

const RequestServerTimestampInterval = 60000;

let calculatedLongitudeTimeDifference = 0;

export default function Home() {
  const [isCoordinatesUnavailable, setIsCoordinatesUnavailable] =
    useState(false);
  const [longitude, setLongitude] = useState(null);
  const [latitude, setLatitude] = useState(null);
  const [movementSpeed, setMovementSpeed] = useState(null);
  const [movementDirection, setMovementDirection] = useState(null);
  const [innacurateClock, setInnacurateClock] = useState(null);
  const [isMovementsUnavailable, setIsMovementsUnavailable] = useState(false);
  const [accurateClock, setAccurateClock] = useState(null);
  const [difference, setDifference] = useState(null);
  const [isAlreadyGeolocated, setIsAlreadyGeolocated] = useState(false);
  const [localTimeDifference, setLocalTimeDifference] = useState(0);

  useInterval(() => requestServerTimestamp(), RequestServerTimestampInterval);

  useRequestAnimationFrame(
    (progress, next) => {
      updateTimeText();
      next();
    },
    { finishAt: -1 }
  );

  const requestServerTimestamp = async () => {
    const timeRequestSent = performance.now();

    const timestamp = await worldTimestamp(); // "Etc/UTC"

    const requestTime = performance.now() - timeRequestSent;
    setLocalTimeDifference(
      timestamp.milliseconds + requestTime / 2 - Date.now()
    );
  };

  const updateTimeText = () => {
    const now = Date.now();
    const timeZoneOffset = new Date().getTimezoneOffset() * 60000;
    const calculatedDate = isAlreadyGeolocated
      ? now +
        localTimeDifference +
        timeZoneOffset +
        calculatedLongitudeTimeDifference
      : now;

    setInnacurateClock(now);
    setAccurateClock(calculatedDate);
    setDifference(
      ["-", "±", "+"][Math.sign(Math.floor(calculatedDate - now)) + 1] +
        format(Math.abs(calculatedDate - now) + timeZoneOffset, "HH:mm:ss.SSS")
    );
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    navigator.geolocation.watchPosition(
      (position) => {
        setIsCoordinatesUnavailable(false);

        const { latitude, longitude, heading, speed } = position.coords;
        calculatedLongitudeTimeDifference = (longitude / 15) * 60 * 60 * 1000;

        setLongitude(longitude);
        setLatitude(latitude);

        if (speed === null) setIsMovementsUnavailable(true);
        setMovementSpeed(speed);
        setMovementDirection(heading);

        if (!isAlreadyGeolocated) {
          setIsAlreadyGeolocated(true);
          requestServerTimestamp();
        }

        document
          .getElementsByClassName(styles.indicator)[0]
          ?.animate([{ opacity: 1 }, { opacity: 0.2 }], {
            duration: 2500,
            easing: "cubic-bezier(0.1, 0.5, 0.25, 1)",
          });
      },
      (error) => {
        console.log(error);
        setIsCoordinatesUnavailable(true);
        setIsMovementsUnavailable(true);
      },
      {
        maximumAge: 0,
        timeout: 20000,
        enableHighAccuracy: true,
      }
    );

    setInterval(requestServerTimestamp, RequestServerTimestampInterval);

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
    };
    resize();

    const stage = new THREE.Object3D();
    const background = new THREE.Object3D();
    scene.add(stage);
    scene.add(background);

    const axisAngle = (23.4 * Math.PI) / 180;
    const axisVector = new THREE.Vector3(
      Math.sin(axisAngle),
      Math.cos(axisAngle),
      0
    );

    const earthIcosphereMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 5),
      new THREE.MeshNormalMaterial({
        wireframe: true,
      })
    );
    const backgroundIcosphereMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(4, 4),
      new THREE.MeshBasicMaterial({
        color: 0x606060,
        wireframe: true,
        transparent: true,
        opacity: 0.4,
      })
    );

    stage.add(earthIcosphereMesh);
    background.add(backgroundIcosphereMesh);

    const animate = (time) => {
      const rad = ((time / 20000) * Math.PI) / 2;
      earthIcosphereMesh.quaternion.setFromAxisAngle(axisVector, rad);
      background.quaternion.setFromAxisAngle(axisVector, rad * 0.8);

      renderer.render(scene, camera);
    };
    renderer.setAnimationLoop(animate);

    window.addEventListener("resize", resize);
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>themostaccurateclockyoucanget.com</title>
        <meta name="description" content="um i assume" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>The Most Accurate Clock You Can Get</h1>

        <div className={styles.description}>
          <div className={styles.topicContainer}>
            <span className={styles.topicTitle}>
              <span className={styles.indicator}></span>
              Your coordinates:
            </span>
            <code
              className={`${styles.code} ${
                isCoordinatesUnavailable && styles.unavailable
              }`}
            >
              {isCoordinatesUnavailable
                ? "---"
                : latitude && longitude
                ? `${Math.abs(latitude).toFixed(7)}°${
                    latitude >= 0 ? "N" : "S"
                  }, ${Math.abs(longitude).toFixed(7)}°${
                    longitude >= 0 ? "E" : "W"
                  }`
                : "..."}
            </code>
          </div>
          <div className={styles.topicContainer}>
            <span className={styles.topicTitle}>Your movements:</span>
            <code
              className={`${styles.code} ${
                isMovementsUnavailable && styles.unavailable
              }`}
            >
              {isMovementsUnavailable
                ? "---"
                : movementSpeed && movementDirection
                ? `${(speed * 3.6).toFixed(3)}km/h, ${heading.toFixed(3)}°`
                : "..."}
            </code>
          </div>
          <div className={styles.topicContainer}>
            <span className={styles.topicTitle}>Your inaccurate clock:</span>
            <code className={styles.code}>
              {innacurateClock
                ? format(innacurateClock, "yyyy/MM/dd HH:mm:ss.SSS")
                : "..."}
            </code>
          </div>
          <div className={styles.topicContainer}>
            <span className={styles.topicTitle}>Your most accurate clock:</span>
            <code className={styles.code}>
              {accurateClock
                ? format(accurateClock, "yyyy/MM/dd HH:mm:ss.SSS")
                : "..."}
            </code>
          </div>
          <div className={styles.topicContainer}>
            <span className={styles.topicTitle}>Difference:</span>
            <code className={styles.code}>{difference ?? "..."}</code>
          </div>
        </div>

        <div className={styles.footer}>
          Made with ❤️ by MugiSus ©︎ 2022-2023
        </div>
      </main>

      <canvas className={styles.canvas}></canvas>
    </div>
  );
}
