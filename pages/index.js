/* eslint-disable react-hooks/exhaustive-deps */
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.scss'
import crypto from 'crypto'
import { format } from 'date-fns'

import { database } from '../utils/firebaseUtil'
import { ref, off, set, serverTimestamp, onChildAdded, onChildRemoved, onChildChanged, onDisconnect } from 'firebase/database'
import { useEffect } from 'react';

export default function Home() {

    const indicatorAniamtion = {
        keyframes: [
            { opacity: 1 },
            { opacity: 0.2 },
        ],
        options: {
            duration: 2000,
            easing: 'ease-out',
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
            if (snapshot.key === "timestamp") {
                const dateUNIXtime = value;
                if (dateUNIXtime) {
                    // codeElements[1].textContent = format(new Date(dateUNIXtime), 'yyyy/MM/dd HH:mm:ss.SSS');
                    localTimeDifference = dateUNIXtime - Date.now();
                }
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
                    lastCoordinates = {latitude, longitude};
                    requestServerTimestamp();
                } else if (lastCoordinates.longitude !== longitude) {
                    indicatorElements[1].animate(indicatorAniamtion.keyframes, indicatorAniamtion.options);
                    lastCoordinates = {latitude, longitude};
                }
            }, (error) => console.log(error));
        };

        geolocate();
        setInterval(geolocate, 4000);

        const updateTimeText = () => {
            const now = Date.now();
            const calcDate = now + localTimeDifference + timeZoneOffset + calculatedLongitudeTimeDifference;

            codeElements[2].textContent = format(now, 'yyyy/MM/dd HH:mm:ss.SSS');
            codeElements[3].textContent = format(calcDate, 'yyyy/MM/dd HH:mm:ss.SSS');
            codeElements[4].textContent = (now < calcDate ? "+" : "-") + format(Math.abs(now - calcDate) + timeZoneOffset, 'HH:mm:ss.SSS');

            requestAnimationFrame(updateTimeText);
        }
        updateTimeText();

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
        </div>
    )
}
