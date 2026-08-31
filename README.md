# AEGIS: Next-Generation Active Cyber Defense

demo Link :-  https://youtu.be/KQ5bLMOQMSo
Traditional antivirus software is fundamentally broken. It relies on signatures -- essentially wanted posters of known viruses. When ransomware modifies its code slightly, traditional security lets it walk right through the front door.

AEGIS abandons signatures entirely. Instead, it relies on behavioral analysis, mathematical entropy, and absolute zero-trust containment to detect and neutralize zero-day ransomware attacks in milliseconds.

## The Four Pillars of AEGIS

Our architecture is built on four core systems that act autonomously to stop threats before data is permanently lost.

### 1. Shannon Entropy (Detection)

We do not look for a virus by name; we look at the data itself. Normal files, like an English document or a codebase, have structural patterns and low randomness. When ransomware encrypts a file, the data becomes entirely random.

AEGIS continuously monitors file write operations at the system level. When a file's Shannon Entropy exceeds a critical threshold (typically 7.5+), the Threat Engine flags it as a cryptographic attack, regardless of what the malware is named.

**Example:** If a thief breaks into a library and starts translating all the books into an unreadable alien language, we don't need to know the thief's name to know something is wrong. We just measure how unreadable the books are becoming.

### 2. The Faraday Cage (Containment)

Ransomware relies on external Command and Control (C2) servers to steal your data and retrieve encryption keys. The millisecond AEGIS detects an attack via entropy analysis, it triggers the Faraday Cage protocol.

AEGIS intercepts the malicious process tree and dynamically severs the network interface at the container level. The malware is instantly isolated from the internet, preventing any data exfiltration. Simultaneously, it extracts the attacker's IP address and broadcasts it to the Threat Intelligence dashboard.

**Example:** Imagine a bank robber trying to call their getaway driver. AEGIS doesn't just lock the bank doors; it instantly turns the entire building into a dead zone where cell phones have zero signal.

### 3. Zero-Trust Vaporization (Recovery)

Detection and containment are only half the battle. AEGIS features an autonomous recovery engine. Before a monitored workload executes, AEGIS takes an ultra-fast, in-memory snapshot of the file system. 

When a threat is contained, AEGIS terminates the hostile processes, systematically deletes any malicious files introduced by the attacker, and instantly restores the encrypted files from the clean snapshot.

**Example:** If someone throws paint on a famous painting, AEGIS doesn't try to wash the paint off. It vaporizes the vandal, deletes the ruined painting, and instantly pulls a perfect replica out of a hidden vault.

### 4. The Counter-Strike (Ransom Note Hijack)

Every ransomware variant drops a ransom note demanding cryptocurrency. Because AEGIS monitors the file system, it intercepts the creation of files like `RANSOM_NOTE.txt`. 

Instead of merely deleting the note, the Recovery Engine overrides the attacker's payload, replacing the hacker's ransom demand with an AEGIS-branded ASCII signature indicating the threat was neutralized.

**Example:** The hacker tries to slide a ransom demand under your door. AEGIS intercepts the paper, erases the hacker's message, writes "NICE TRY - THREAT NEUTRALIZED" on it, and slides it back.

---

## Technical Architecture

AEGIS is built to be lightweight, incredibly fast, and visually striking.

- **Frontend Console:** Built with Next.js, React, and Tailwind CSS. It uses a sleek, monochrome design system to display real-time threat intelligence without visual clutter.
- **Real-Time Communication:** Utilizes Server-Sent Events (SSE) to stream telemetry, threat scores, and containment logs from the backend engine to the dashboard with zero latency.
- **Backend Orchestrator:** Written in TypeScript. It interfaces directly with the Docker Daemon via the Docker API to monitor container workloads, execute surgical strikes (process killing), and manipulate network stacks dynamically.
- **Warzone Simulator:** The project includes a highly realistic, bash-based ransomware simulator that mimics modern attack vectors, including C2 communication, high-entropy encryption loops, and ransom note deployment.

## The Live Demo Playbook (How to Operate AEGIS)

To present this to the judges flawlessly, follow this exact sequence. You will need your browser open on one half of the screen, and a Terminal window open on the other half.

### 1. Boot the System
Start the AEGIS engine and frontend dashboard:
```bash
cd my-app/my-app
npm install
npm run dev
```

### 2. Initialize the Defense Grid
- Open your browser and navigate to `http://localhost:3000`.
- You will see the AEGIS Landing Page. Click **"Deploy Agent"** to enter the Threat Console.
- On the dashboard, click **"Start AEGIS"**. 
- *What happens:* Behind the scenes, AEGIS spins up the protected Docker workload, begins kernel-level monitoring, and takes a silent baseline snapshot of the `/sandbox/data` directory.

### 3. Prove the Baseline (Pre-Attack)
Before launching the attack, prove to the judges that the container is online and document files are readable text.
In your Terminal, run:
```bash
# 1. Prove document_1.txt contains readable text
docker exec aegis-target cat /sandbox/data/document_1.txt

# 2. Prove the container has internet access (leave this running)
docker exec aegis-target ping 8.8.8.8
```
You will see normal readable document text (`This is a synthetic document file number 1...`) and the live ping output.

### 4. Detonate the Malware
- Back on the AEGIS dashboard, click **"Launch Ransomware"**.
- Tell the judges to watch the screen closely.

### 5. Observe the Autonomous Defense
Within a fraction of a second, the following will happen automatically:
1. **Detection:** The Entropy Gauge on the dashboard will instantly spike to 100 as `document_1.txt` and other files are encrypted into random binary data.
2. **Reverse-Trace:** A glowing red Threat Intelligence box will pop up, displaying the exact IP address the hacker was trying to contact (e.g., `198.51.100.42`).
3. **The Faraday Cage:** Point to your Terminal. The `ping 8.8.8.8` command will have completely **frozen**. AEGIS dynamically severed the network interface, trapping the malware.
4. **Vaporization & Recovery:** The dashboard metrics will show the infected files being deleted and the original files being instantly restored from the snapshot.

To prove `document_1.txt` was fully recovered from the attack, press `Ctrl+C` to cancel the frozen ping, and run:
```bash
docker exec aegis-target cat /sandbox/data/document_1.txt
```
*Result:* The document text is 100% recovered and readable again (`This is a synthetic document file number 1...`). The encrypted gibberish has been vaporized!

### 6. The Final Reveal (The Counter-Strike)
Now that the malware attempted to drop a ransom note during the attack, tell the judges: *"Normally, hackers leave a ransom note demanding Bitcoin. Let me show you how AEGIS hijacked their ransom note."*

Run this command in your Terminal:
```bash
docker exec aegis-target cat /sandbox/data/RANSOM_NOTE.txt
```
*Note: `RANSOM_NOTE.txt` is created when the ransomware launches. AEGIS intercepts it and overwrites it with our shield signature.*

Instead of a hacker's demand, the terminal will print a massive ASCII AEGIS Shield with the message: **"THREAT NEUTRALIZED. MALWARE VAPORIZED BY AEGIS. NICE TRY."**

---
Built to protect the future of data.
