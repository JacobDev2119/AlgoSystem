let jobs = [], currentTime = 0, isStopped = false;
let jobTableBody = document.getElementById("jobTableBody");
let currentJobEl = document.getElementById("currentJob");
let currentTimeEl = document.getElementById("currentTime");
let gantt = document.getElementById("ganttChart");
let avgWaitingEl = document.getElementById("avgWaiting");
let avgTurnaroundEl = document.getElementById("avgTurnaround");
let utilizationEl = document.getElementById("utilization");

function generateJobs(count) {
  jobs = [];
  for (let i = 0; i < count; i++) {
    const arrive = Math.floor(Math.random() * 5);
    const burst = Math.floor(Math.random() * 5) + 1;
    const priority = Math.floor(Math.random() * 5) + 1;
    jobs.push({ 
      id: i + 1, 
      arrive, 
      burst, 
      priority, 
      remain: burst, 
      start: null, 
      finish: null, 
      wait: 0, 
      turn: 0, 
      percent: 0 
    });
  }
  renderJobs();
}

function renderJobs() {
  jobTableBody.innerHTML = "";
  jobs.forEach(job => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>P${job.id}</td>
      <td>${job.arrive}</td>
      <td>${job.burst}</td>
      <td>${job.start ?? '-'}</td>
      <td>${job.finish ?? '-'}</td>
      <td>${job.turn > 0 ? job.turn : '-'}</td>
      <td>${job.wait}</td>
      <td>${job.percent.toFixed(2)}%</td>
    `;
    jobTableBody.appendChild(row);
  });
}

function renderReadyQueue(queue) {
  const readyQueueDisplay = document.getElementById("readyQueueDisplay");
  readyQueueDisplay.innerHTML = "";
  if (queue.length === 0) {
    readyQueueDisplay.textContent = "Empty";
    return;
  }
  queue.forEach(job => {
    const box = document.createElement("span");
    box.textContent = `P${job.id}`;
    readyQueueDisplay.appendChild(box);
  });
}

function simulateSchedulingAnimated() {
  const algorithm = document.getElementById("algorithm").value;
  currentTime = 0;
  let cpuActiveTime = 0;
  gantt.innerHTML = "";
  currentTimeEl.textContent = currentTime;
  jobs.sort((a, b) => a.arrive - b.arrive);

  function step() {
    if (jobs.every(j => j.remain <= 0)) {
      currentJobEl.textContent = "-";
      const utilization = (cpuActiveTime / currentTime) * 100;
      utilizationEl.textContent = `${utilization.toFixed(2)}%`;
      const avgWait = jobs.reduce((a, b) => a + b.wait, 0) / jobs.length;
      const avgTurn = jobs.reduce((a, b) => a + b.turn, 0) / jobs.length;
      avgWaitingEl.textContent = avgWait.toFixed(2);
      avgTurnaroundEl.textContent = avgTurn.toFixed(2);
      renderJobs();
      return;
    }

    const readyQueue = jobs.filter(j => j.arrive <= currentTime && j.remain > 0);
    renderReadyQueue(readyQueue);

    if (readyQueue.length === 0) {
      currentJobEl.textContent = "Idle";
      const idleBox = document.createElement("div");
      idleBox.textContent = "Idle";
      gantt.appendChild(idleBox);
      currentTime++;
      currentTimeEl.textContent = currentTime;
      renderJobs();
      setTimeout(step, 1000);
      return;
    }

    let job;
    switch (algorithm) {
      case "FCFS": readyQueue.sort((a, b) => a.arrive - b.arrive); break;
      case "SJF": readyQueue.sort((a, b) => a.burst - b.burst); break;
      case "SRTF": readyQueue.sort((a, b) => a.remain - b.remain); break;
      case "PriorityNonPreemptive": readyQueue.sort((a, b) => a.priority - b.priority); break;
      case "PriorityPreemptive": readyQueue.sort((a, b) => a.priority - b.priority); break;
    }
    job = readyQueue[0];

    if (job.start === null) job.start = currentTime;
    job.remain--;
    cpuActiveTime++;
    currentJobEl.textContent = `P${job.id}`;
    const box = document.createElement("div");
    box.textContent = `P${job.id}`;
    box.setAttribute("data-pid", job.id);
    gantt.appendChild(box);

    jobs.forEach(j => {
      if (j !== job && j.arrive <= currentTime && j.remain > 0) j.wait++;
    });

    if (job.remain === 0) {
      job.finish = currentTime + 1;
      job.turn = job.finish - job.arrive;
      job.percent = (job.burst / job.turn) * 100;
    }

    renderJobs();
    currentTime++;
    currentTimeEl.textContent = currentTime;
    setTimeout(step, 1000);
  }

  step();
}

document.getElementById("startButton").addEventListener("click", () => {
  generateJobs(parseInt(document.getElementById("jobCount").value));
  simulateSchedulingAnimated();
});

document.getElementById("resetButton").addEventListener("click", () => location.reload());
document.getElementById("stopButton").addEventListener("click", () => isStopped = true);
document.getElementById("resumeButton").addEventListener("click", () => {
  if (isStopped) {
    isStopped = false;
    simulateSchedulingAnimated();
  }
});
