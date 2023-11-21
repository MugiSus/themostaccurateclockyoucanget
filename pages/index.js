import Head from "next/head";
import styles from "../styles/Home.module.scss";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import worldTimestamp from "world-timestamp";
import * as THREE from "three";
import useRequestAnimationFrame from "beautiful-react-hooks/useRequestAnimationFrame";
import useInterval from "beautiful-react-hooks/useInterval";

const RequestServerTimestampInterval = 60000;

function initThree() {
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

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  resize();

  window.addEventListener("resize", resize);
}

export default function Home() {
  const [isAlreadyGeolocated, setIsAlreadyGeolocated] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isCoordinatesUnavailable, setIsCoordinatesUnavailable] =
    useState(false);
  const [longitude, setLongitude] = useState(null);
  const [latitude, setLatitude] = useState(null);

  const [isMovementsUnavailable, setIsMovementsUnavailable] = useState(false);
  const [movementSpeed, setMovementSpeed] = useState(null);
  const [movementHeading, setMovementHeading] = useState(null);

  const [localTimeDifference, setLocalTimeDifference] = useState(0);
  const [longitudeTimeDifference, setLongitudeTimeDifference] = useState(0);

  const [sunriseTime, setSunriseTime] = useState(null);
  const [southingTime, setSouthingTime] = useState(null);
  const [sunsetTime, setSunsetTime] = useState(null);

  const timeZoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

  const mostAccurateDate = isAlreadyGeolocated
    ? new Date(
        currentDate.getTime() +
          localTimeDifference +
          longitudeTimeDifference +
          timeZoneOffset
      )
    : currentDate;

  useInterval(() => requestServerTimestamp(), RequestServerTimestampInterval);
  useRequestAnimationFrame(
    (progress, next) => {
      setCurrentDate(new Date());
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

  const updateDiff = (position) => {
    const { latitude, longitude, heading, speed } = position.coords;

    const longitudeTimeDiff = (longitude / 15) * 60 * 60 * 1000;
    const mostAccurateDate = new Date(
      currentDate.getTime() +
        localTimeDifference +
        longitudeTimeDiff +
        timeZoneOffset
    );

    const thisYear = mostAccurateDate.getFullYear();
    const yearLength = new Date(thisYear + 1, 0, 1) - new Date(thisYear, 0, 1);
    const fromBegginingOfYear = mostAccurateDate - new Date(thisYear, 0, 1);
    const theta = (fromBegginingOfYear / yearLength) * 2 * Math.PI;

    const equationOfTime =
      229.18 *
      (0.000075 +
        0.001868 * Math.cos(theta) -
        0.032077 * Math.sin(theta) -
        0.014615 * Math.cos(2 * theta) -
        0.040849 * Math.sin(2 * theta));

    const declination =
      0.006918 -
      0.399912 * Math.cos(theta) +
      0.070257 * Math.sin(theta) -
      0.006758 * Math.cos(2 * theta) +
      0.000907 * Math.sin(2 * theta) -
      0.002697 * Math.cos(3 * theta) +
      0.00148 * Math.sin(3 * theta);

    const hourAngle = Math.acos(
      Math.cos((90.833 * Math.PI) / 180) /
        (Math.cos((latitude * Math.PI) / 180) * Math.cos(declination)) -
        Math.tan((latitude * Math.PI) / 180) * Math.tan(declination)
    );

    const southingTime =
      (720 - equationOfTime) * 60 * 1000 -
      localTimeDifference -
      longitudeTimeDiff;
    const sunriseTime =
      (720 - 4 * (hourAngle / Math.PI) * 180 - equationOfTime) * 60 * 1000 -
      localTimeDifference -
      longitudeTimeDiff;
    const sunsetTime =
      (720 + 4 * (hourAngle / Math.PI) * 180 - equationOfTime) * 60 * 1000 -
      localTimeDifference -
      longitudeTimeDiff;

    setLongitude(longitude);
    setLatitude(latitude);

    setIsMovementsUnavailable(speed === null && movementSpeed === null);

    if (speed !== null) setMovementSpeed(speed);
    if (heading !== null) setMovementHeading(heading);

    setLongitudeTimeDifference(longitudeTimeDiff);

    setSouthingTime(southingTime);
    setSunriseTime(sunriseTime);
    setSunsetTime(sunsetTime);

    document
      .getElementsByClassName(styles.indicator)[0]
      ?.animate([{ opacity: 1 }, { opacity: 0.2 }], {
        duration: 2500,
        easing: "cubic-bezier(0.1, 0.5, 0.25, 1)",
      });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setIsCoordinatesUnavailable(false);
        setIsMovementsUnavailable(position.coords.speed === null);

        if (!isAlreadyGeolocated) {
          setIsAlreadyGeolocated(true);
          requestServerTimestamp();
        }
        updateDiff(position);
      },
      (error) => {
        console.error(error);
        setIsCoordinatesUnavailable(true);
        setIsMovementsUnavailable(true);
      },
      {
        maximumAge: 0,
        timeout: 20000,
        enableHighAccuracy: true,
      }
    );

    initThree();

    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              Your coordinates
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
            <span className={styles.topicTitle}>Your movements</span>
            <code
              className={`${styles.code} ${
                isMovementsUnavailable && styles.unavailable
              }`}
            >
              {isMovementsUnavailable
                ? "---"
                : movementSpeed && movementHeading
                ? `${(movementSpeed * 3.6).toFixed(
                    3
                  )}km/h, ${movementHeading.toFixed(3)}°`
                : "..."}
            </code>
          </div>
          <div className={styles.topicContainer}>
            <span className={styles.topicTitle}>Your inaccurate clock</span>
            <code className={styles.code}>
              {isAlreadyGeolocated
                ? format(currentDate, "yyyy/MM/dd HH:mm:ss.SSS")
                : "..."}
            </code>
          </div>
          <div className={styles.topicContainer}>
            <span className={styles.topicTitle}>Your most accurate clock</span>
            <code className={styles.code}>
              {isAlreadyGeolocated
                ? format(mostAccurateDate, "yyyy/MM/dd HH:mm:ss.SSS")
                : "..."}
            </code>
          </div>
          <div className={styles.topicContainer}>
            <span className={styles.topicTitle}>Difference</span>
            <code className={styles.code}>
              {currentDate &&
                `${
                  ["-", "±", "+"][Math.sign(mostAccurateDate - currentDate) + 1]
                }${format(
                  mostAccurateDate - currentDate + timeZoneOffset,
                  "HH:mm:ss.SSS"
                )}`}
            </code>
          </div>
          <details>
            <summary className={styles.detailSummary}>Advanced</summary>
            <div className={styles.topicContainer}>
              <span className={styles.topicTitle}>Sunrise Time</span>
              <code className={styles.code}>
                {isAlreadyGeolocated
                  ? format(sunriseTime, "HH:mm:ss.SSS")
                  : "..."}
              </code>
            </div>
            <div className={styles.topicContainer}>
              <span className={styles.topicTitle}>Southing Time</span>
              <code className={styles.code}>
                {isAlreadyGeolocated
                  ? format(southingTime, "HH:mm:ss.SSS")
                  : "..."}
              </code>
            </div>
            <div className={styles.topicContainer}>
              <span className={styles.topicTitle}>Sunset Time</span>
              <code className={styles.code}>
                {isAlreadyGeolocated
                  ? format(sunsetTime, "HH:mm:ss.SSS")
                  : "..."}
              </code>
            </div>
          </details>
        </div>

        <div className={styles.footer}>
          Made with ❤️ by MugiSus ©︎ 2022-2023
        </div>
      </main>

      <canvas className={styles.canvas}></canvas>
    </div>
  );
}
