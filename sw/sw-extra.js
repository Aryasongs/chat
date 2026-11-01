/* marsX — extra service-worker features: Background Sync, push badge, subscription refresh.
   Add this as the FIRST line of your existing sw.js:   importScripts('sw-extra.js');
   (it only adds listeners; your existing push / notificationclick code keeps working) */

async function tellClients(msg){
  const cs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  cs.forEach(c=>c.postMessage({marsx:msg}));
  return cs.length;
}

// Background Sync: the page registers 'marsx-outbox' when a message was written while offline.
// Messages are end-to-end encrypted inside the page, so the worker wakes the open page to flush the queue.
// If no page is open we throw, and the browser retries the sync later.
self.addEventListener('sync',e=>{
  if(e.tag!=='marsx-outbox') return;
  e.waitUntil((async()=>{ if(!(await tellClients('flush-outbox'))) throw new Error('no client yet'); })());
});

// Badge: show a dot on the app icon when a push arrives while the app is closed (the page sets the real count when opened).
self.addEventListener('push',e=>{
  e.waitUntil((async()=>{
    try{
      const cs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
      if(cs.some(c=>c.visibilityState==='visible')) return;
      if(self.navigator&&self.navigator.setAppBadge) await self.navigator.setAppBadge();
    }catch(_){}
  })());
});

// Push subscription expired/rotated: ask the page to subscribe again.
self.addEventListener('pushsubscriptionchange',e=>{ e.waitUntil(tellClients('resubscribe')); });
