import styles from './countdown.module.scss';
import { useState, useEffect } from 'react';

export default function Countdown() {
  const [day1, setDay1] = useState<number>();
  const [day2, setDay2] = useState<number>();
  const [hour1, setHour1] = useState<number>();
  const [hour2, setHour2] = useState<number>();
  const [minute1, setMinute1] = useState<number>();
  const [minute2, setMinute2] = useState<number>();
  const [second1, setSecond1] = useState<number>();
  const [second2, setSecond2] = useState<number>();
  const [isExpired, setIsExpired] = useState<boolean>();
  const [distance, setDistance] = useState<number>();

  // Set the date we're counting down to
  var countDownDate = 1639730400000;

  // Update the count down every 1 second
  var x = setInterval(function () {
    // Get today's date and time
    var now = new Date().getTime();

    // Find the distance between now and the count down date
    var dist = countDownDate - now;
    if (dist >= 0) {
      var day = Math.floor(dist / (1000 * 60 * 60 * 24));
      var day1 = day < 10 ? 0 : parseInt((day / 10).toString());
      var day2 = day % 10;

      var hour = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var hour1 = hour < 10 ? 0 : parseInt((hour / 10).toString());
      var hour2 = hour % 10;

      var minute = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
      var minute1 = minute < 10 ? 0 : parseInt((minute / 10).toString());
      var minute2 = minute % 10;

      var second = Math.floor((dist % (1000 * 60)) / 1000);
      var second1 = second < 10 ? 0 : parseInt((second / 10).toString());
      var second2 = second % 10;

      setDay1(day1);
      setDay2(day2);
      setHour1(hour1);
      setHour2(hour2);
      setMinute1(minute1);
      setMinute2(minute2);
      setSecond1(second1);
      setSecond2(second2);
    } else {
      setDay1(0);
      setDay2(0);
      setHour1(0);
      setHour2(0);
      setMinute1(0);
      setMinute2(0);
      setSecond1(0);
      setSecond2(0);
      clearInterval(x);
      setIsExpired(true);
    }

    // Display the result in the element with id="demo"
    // document.getElementById('demo').innerHTML = days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's ';

    // If the count down is finished, write some text

    // if (distance < 0) {
    //   clearInterval(x);
    //   setIsExpired(true);
    // }
  }, 1000);

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <div className={styles.days}>
          <div className={styles.day}>
            <p id="day-1">{day1}</p>
          </div>
          <div className={styles.day}>
            <p id="day-1">{day2}</p>
          </div>
        </div>
        <p className={styles.desc}>Days</p>
      </div>
      <div className={styles.container}>
        <div className={styles.hours}>
          <div className={styles.hour}>
            <p id="hour-1">{hour1}</p>
          </div>
          <div className={styles.hour}>
            <p id="hour-1">{hour2}</p>
          </div>
        </div>
        <p className={styles.desc}>Hours</p>
      </div>
      <div className={styles.container}>
        <div className={styles.minutes}>
          <div className={styles.minute}>
            <p id="minute-1">{minute1}</p>
          </div>
          <div className={styles.minute}>
            <p id="minute-1">{minute2}</p>
          </div>
        </div>
        <p className={styles.desc}>Minutes</p>
      </div>

      <div className={styles.container}>
        <div className={styles.seconds}>
          <div className={styles.second}>
            <p id="second-1">{second1}</p>
          </div>
          <div className={styles.second}>
            <p id="second-1">{second2}</p>
          </div>
        </div>
        <p className={styles.desc}>Seconds</p>
      </div>
    </div>
  );
}
