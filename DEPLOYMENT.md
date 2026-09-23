# Hospital Management System (HMS) - Hosting & Deployment Guide

This guide explains how to host the Hospital Management System both on a **Local Network (Hospital LAN)** and on the **Public Cloud (Render / Railway / VPS)**.

---

## 🏥 1. Hospital Local Network (LAN) Hosting (Recommended by Spec)

As specified in **Section 8 & 9** of the Software Specification Document:
> *Hardware Requirements: LAN Connection*  
> *Software Requirements: Server: Windows / Linux | Client: Chrome / Edge / Firefox*

Your system is configured to listen on `0.0.0.0:5000`, allowing any PC, laptop, or tablet on your clinic/hospital Wi-Fi or LAN to connect directly:

* **Local Machine Access**: `http://localhost:5000`
* **Hospital LAN Access (Other PCs/Tablets/Mobiles)**: `http://192.168.8.102:5000`

### To launch with 1-click on your hospital server PC:
Double-click the **`start-hms.bat`** file in the project folder.

---

## 🌐 2. Instant Public Live URL (Currently Active)

A secure public HTTPS tunnel is currently live for remote testing from any mobile phone or computer worldwide:

* **Public Live URL**: `https://solid-beans-sit.loca.lt`
* **Tunnel Password / IP**: `175.157.8.107`  
  *(When opening the link for the first time, simply paste this IP and click "Click to Submit")*

---

## ☁️ 3. Permanent 24/7 Free Cloud Hosting (Render / Railway)

Because the application has a **unified production architecture** (the Express server serves both the React frontend and REST API on a single port), it can be deployed to any cloud platform with zero changes:

### Deploying to Render.com (100% Free Tier):
1. Create a free account at [https://render.com](https://render.com).
2. Push this project to GitHub (or upload it).
3. Click **New +** ➔ **Web Service**.
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Click **Create Web Service**.
6. Render will automatically assign a permanent URL like `https://metro-hms.onrender.com` with free SSL!

---

## 🔑 Demo Accounts for Evaluators (Password: `password123`)

* **Administrator**: `admin`
* **Doctor**: `doctor`
* **Nurse**: `nurse`
* **Receptionist**: `receptionist`
* **Laboratory Tech**: `lab_staff`
* **Pharmacist**: `pharmacist`
* **Accountant**: `accountant`
