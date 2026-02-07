Manual testing:
- Create session → copy URL → open in incognito → join with same name (should show "taken" error)
- Join with different name → vote → verify toast + optimistic update
- First user sees Reveal/New Round buttons, second user sees "waiting" status                    
- Reveal cards → verify fade-in animation on results                  
- Disconnect network → verify error banner + error toast on vote attempt                         
- Reconnect → verify toast for recovery    
- Navigate with keyboard only through voting cards (Tab, Arrow keys, Enter)                      
- Enter invalid session ID in join form → verify "Session not found" error                       
- Test on mobile viewport: cards, controls, results should stack cleanly