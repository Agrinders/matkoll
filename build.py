#!/usr/bin/env python3
"""Builds index.html and sw.js from page.html. Run after every change to page.html."""
import hashlib,pathlib
d=pathlib.Path(__file__).parent;src=(d/'page.html').read_text(encoding='utf8')
cut=src.index('</style>')+len('</style>')
head,body=src[:cut],src[cut:].lstrip('\n')
extra='''<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#fcfbff"><link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icons/icon-192.png"><link rel="apple-touch-icon" href="icons/icon-192.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}[hidden]{display:none!important}body{margin:0}</style>
'''
html='<!doctype html>\n<html lang="sv">\n<head>\n'+extra+head+'\n<script src="app-shell.js"></script>\n</head>\n<body>\n'+body+'\n<script>if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js")</script>\n</body>\n</html>\n'
(d/'index.html').write_text(html,encoding='utf8')
files=['index.html','app-shell.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png']
ver=hashlib.sha256(b''.join((d/f).read_bytes() for f in files)).hexdigest()[:12]
sw=(d/'sw.template.js').read_text(encoding='utf8').replace('__VERSION__',ver).replace('__FILES__',repr(['./']+files))
(d/'sw.js').write_text(sw,encoding='utf8');print('built',ver)
