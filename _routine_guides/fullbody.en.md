---
routine_slug: fullbody
translation_key: guide-fullbody
lang: en
title: Guide
description: Learn who this routine is for, how to run it week to week, and what supporting variations to read next.
excerpt: How to use this routine and when it fits best.
permalink: /en/routines/fullbody/guide/
---

{% assign routine = site.routines | where: "slug", page.routine_slug | first %}
{% assign routine_name = routine.name[page.lang] | default: routine.name %}
{% assign routine_desc = routine.desc[0][page.lang] | default: routine.desc[0].en %}
{% assign tracker_url = routine.url | relative_url %}

## How to follow this routine

1. Open the routine: [{{ routine_name }}]({{ tracker_url }})
2. Follow the exercises
3. Tap each one when done
4. Repeat next week

{{ routine_desc }}

## What this routine is for

This {{ routine_name }} routine is built for lifters who want frequent exposure to the main compound lifts while still keeping enough room for targeted accessory work. It works well when you want a simple structure and steady strength-oriented progression.

## Who should use it

Use it if you can train three to four times per week and you prefer repeating the big patterns across the week instead of splitting muscles into separate days.

## How to run it

Keep the main compounds as the priority lifts of each session. Use accessory work to cover weak points, add volume where recovery allows, and keep fatigue under control.

## What to watch

If your lower back, elbows, or shoulders accumulate too much fatigue, reduce accessory volume first before changing the core lifts.
