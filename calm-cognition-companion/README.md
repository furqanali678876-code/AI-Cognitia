# Gentle Mind Hub

You are a Staff-Level Mobile App Engineer, Senior Flutter Developer, Senior UI/UX Designer, Accessibility Expert, Healthcare UX Specialist, and Product Architect.

I already have a mobile application under development. Your task is to completely redesign, improve, and productionize the application.

Project Name

AI Cognitia

This application is designed to assist elderly users, including people experiencing memory loss, mild cognitive impairment, and dementia-related challenges.

The current UI feels boring, outdated, and uses a green color scheme that does not create trust, comfort, or clarity for elderly users.

Your responsibility is to redesign the entire frontend experience and properly integrate all backend services.

Primary Goal

Create a beautiful, calming, highly accessible, dementia-friendly mobile application that helps users:

Remember important tasks

Receive reminders

Stay organized

Access cognitive support tools

Play simple offline games

Manage their daily routine easily

The application should feel:

Safe

Trustworthy

Calm

Premium

Easy to understand

Elderly-friendly

Critical UI/UX Requirements

Do NOT use the existing green-heavy design.

Replace it with a dementia-friendly healthcare design system.

Preferred colors:

Deep Blue

Soft Navy

Warm White

Light Lavender

Soft Sky Blue

Gentle Purple Accents

Avoid:

Neon colors

Excessive gradients

Harsh contrasts

Overly modern Gen-Z styling

Tiny text

Accessibility Requirements

Design specifically for elderly users.

Implement:

Large touch targets

Large typography

High readability

Voice-friendly navigation

Clear labels

Simple language

Reduced cognitive load

Minimal clutter

High contrast mode

Screen reader compatibility

All buttons should be easily tappable.

No complex navigation patterns.

Authentication System

Implement a complete production-ready authentication flow.

Backend integration must support:

Email Authentication

Register

Login

Email OTP Verification

Forgot Password

Reset Password

Change Password

Phone Authentication

Phone Number Registration

Phone OTP Verification

Login using Phone OTP

Resend OTP

OTP Expiry Timer

Session Management

JWT Authentication

Refresh Tokens

Secure Logout

Remember Me

Auto Login

Store tokens securely.

Use proper interceptors and authentication guards.

Reminder System

The reminder module is the core feature.

Current backend already exists.

Integrate all APIs.

Features:

Reminder Creation

Title

Description

Date

Time

Priority

Reminder Types

Medication Reminder

Doctor Appointment

Daily Routine

Hydration Reminder

Family Reminder

Custom Reminder

Reminder Alarm System

Very Important:

A reminder should not behave like a normal notification.

It must trigger:

Loud Alarm

Full Screen Alert

Vibration

Notification Banner

Reminder Popup

The alarm should continue until:

User presses Done

User presses Snooze

Add:

5 Min Snooze

10 Min Snooze

15 Min Snooze

Dashboard Redesign

Create a calming dashboard.

Show:

Welcome Message

Today's Tasks

Upcoming Reminders

Medication Status

Daily Progress

Family Messages

Quick Actions

Use large cards.

Avoid clutter.

Offline Games Module

Existing games already work.

Create:

Games Dashboard

Memory Games

Brain Exercises

Progress Tracking

Achievement Badges

Design should feel therapeutic and calming.

AI Assistant Area

Create a dedicated AI Cognitia Assistant section.

Features:

Voice Input

Text Input

Conversation History

Quick Questions

Examples:

What medicines should I take today?

What is my next appointment?

Remind me to drink water.

Design should be simple enough for elderly users.

Navigation System

Replace the current navigation.

Create a modern bottom navigation:

Home

Reminders

AI Assistant

Games

Profile

Navigation should be obvious and easy.

Profile Section

Features:

Personal Information

Emergency Contacts

Caregiver Information

Medical Information

Notification Settings

Alarm Settings

Logout

Design System

Create a complete design system.

Include:

Typography

Large readable fonts.

Examples:

Headings: 24–32px

Body: 16–20px

Buttons: 18–20px

Components

Buttons

Cards

Inputs

Dialogs

Modals

Reminder Cards

AI Chat Components

All components must follow accessibility standards.

Animations

Use subtle animations only.

Examples:

Fade In

Slide In

Soft Transitions

Avoid flashy animations.

Flutter Architecture

Use:

Flutter Latest Stable

Riverpod

Dio

GoRouter

Hive

Material 3

Implement:

Clean Architecture

Repository Pattern

Dependency Injection

Modular Features

Code Quality

Generate:

Production-ready code

Reusable widgets

Responsive layouts

Null Safety

Error handling

Loading states

Empty states

Offline handling

Final Deliverable

Refactor the entire application into a polished healthcare-grade product called "AI Cognitia".

The final application should look like a real-world dementia-care mobile app that could be published on the Play Store and used by elderly people daily.

Focus heavily on:

Accessibility

Elderly-friendly UX

Strong authentication

Reliable reminder alarms

Clean architecture

Premium healthcare UI

Production-ready Flutter code

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/04386116-c869-457a-81ad-e88da0a1a30a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
