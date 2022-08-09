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

    let longitude, latitude;
    let localTimeDifference = 0;

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const sessionId = crypto.randomBytes(12).toString('base64').replaceAll('/', '-').replaceAll('+', '_');
        document.getElementsByClassName(styles.code)[0].textContent = sessionId;

        const references = {
            root: ref(database, "/"),
            sessions: ref(database, `/sessions`),
            mysession: ref(database, `/sessions/${sessionId}`),
        };
    
        off(references.root);
        off(references.sessions);
        off(references.mysession);
    
        set(references.mysession, {
            timestamp: serverTimestamp(),
        })
    
        onChildChanged(references.sessions, (snapshot) => {
            const value = snapshot.val();
            // console.log(`child changed "${snapshot.key}":`, snapshot.val());
            if (snapshot.key === sessionId) {
                const dateUNIXtime = value.timestamp + (value.longitude - 135) / 15 * 1000 * 60 * 60;
                if (dateUNIXtime) {
                    // document.getElementsByClassName(styles.code)[1].textContent = format(new Date(dateUNIXtime), 'yyyy/MM/dd HH:mm:ss.SSS');
                    localTimeDifference = dateUNIXtime - Date.now();
                }
            }
        });

        onChildAdded(references.sessions, (snapshot) => {
            console.log(`child added "${snapshot.key}":`, snapshot.val());
        });

        onChildRemoved(references.sessions, (snapshot) => {
            console.log(`child removed "${snapshot.key}":`, snapshot.val());
        });
    
        onDisconnect(references.mysession).remove();

        const geolocate = () => {
            navigator.geolocation.getCurrentPosition((position) => {
                [longitude, latitude] = [position.coords.longitude, position.coords.latitude];
                set(references.mysession, {
                    timestamp: serverTimestamp(),
                    longitude,
                    latitude,
                });
                document.getElementsByClassName(styles.code)[1].textContent = `${latitude}, ${longitude}`;
            }, (error) => console.log(error));
        };

        const updateTimeText = () => {
            const date = new Date(Date.now() + localTimeDifference);
            document.getElementsByClassName(styles.code)[2].textContent = format(Date.now(), 'yyyy/MM/dd HH:mm:ss.SSS');
            document.getElementsByClassName(styles.code)[3].textContent = format(date, 'yyyy/MM/dd HH:mm:ss.SSS');
            requestAnimationFrame(updateTimeText);
        }
        updateTimeText();

        geolocate();
        setInterval(geolocate, 5000);
    }, [])

    return (
        <div className={styles.container}>
            <Head>
                <title>themostaccurateclockyoucanget.com</title>
                <meta name="description" content="Generated by create next app" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <h1 className={styles.title}>
                    The Most Accurate Clock You Can Get
                </h1>

                <p className={styles.description}>
                    Your session ID:
                    <code className={styles.code}>------------</code>
                    <br />
                    Your coordinates:
                    <code className={styles.code}></code>
                    <br />
                    Your inaccurate clock:
                    <code className={styles.code}></code>
                    <br />
                    Your most accurate clock:
                    <code className={styles.code}></code>
                </p>
            </main>
        </div>
    )
}
