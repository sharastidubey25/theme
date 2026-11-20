#!/usr/bin/env bash
# Login / Create-account popup (auth.js) states over the homepage → figma-screens/12-login (run from set-5/, server on :8000)
set -e
cd "$(dirname "$0")/.."
D=figma-screens/12-login
H='const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],w=ms=>new Promise(r=>setTimeout(r,ms));
const typ=(el,v)=>{el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}))};
const F=$("#auForm").elements;'
LOGIN="$H FPAuth.open('account.html','login'); await w(500);"
REG="$H FPAuth.open('account.html','register'); await w(500);"
OTP='typ(F.mobile,"9876543210"); $("#auForm").requestSubmit(); await w(1200);'
ROTP='typ(F.name,"Rahul Sharma"); typ(F.email,"rahul@sharmatech.in"); typ(F.mobile,"9876543210"); $("#auForm").requestSubmit(); await w(1200);'
DONE='$$(".au-step").forEach(s=>s.hidden=s.dataset.step!=="3");'
snap() { node figma-screens/snap.mjs index.html "$D/$1.html" "$2" --height 900 --wait 4000 --js "$3"; }

snap 01-login "Login 01 · Login · Mobile number" "$LOGIN" &
snap 02-login-filled "Login 02 · Login · Number entered" "$LOGIN typ(F.mobile,'9876543210');" &
snap 03-login-error "Login 03 · Login · Invalid number" "$LOGIN typ(F.mobile,'12345'); \$('#auForm').requestSubmit(); await w(300);" &
snap 04-otp "Login 04 · OTP · Enter code" "$LOGIN $OTP" &
wait
snap 05-otp-filled "Login 05 · OTP · Code entered" "$LOGIN $OTP \$\$('#auOtp input').forEach((b,i)=>b.value='482916'[i]);" &
snap 06-otp-error "Login 06 · OTP · Wrong code" "$LOGIN $OTP \$('#auErr').hidden=false; \$('#auOtp').classList.add('bad');" &
snap 07-otp-resend "Login 07 · OTP · Resend OTP" "$LOGIN $OTP await w(32500);" &
snap 08-logged-in "Login 08 · Success · You're logged in" "$LOGIN typ(F.mobile,'9876543210'); $DONE \$('#auDoneT').textContent=\"You're logged in\"; \$('#auDoneD').textContent='Taking you to My Account…';" &
wait
snap 09-register "Login 09 · Create account · Individual" "$REG" &
snap 10-register-filled "Login 10 · Create account · Details filled" "$REG typ(F.name,'Rahul Sharma'); typ(F.email,'rahul@sharmatech.in'); typ(F.mobile,'9876543210');" &
snap 11-register-errors "Login 11 · Create account · Validation errors" "$REG typ(F.email,'rahul@'); \$('#auForm').requestSubmit(); await w(300);" &
snap 12-register-business "Login 12 · Create account · Business" "$REG \$('.au-type [data-v=firm]').click(); await w(200);" &
wait
snap 13-business-gst-ok "Login 13 · Business · GST validated" "$REG \$('.au-type [data-v=firm]').click(); typ(F.name,'Rahul Sharma'); typ(F.mobile,'9876543210'); typ(F.firm,'Sharma Tech Solutions'); typ(F.gst,'08AABCF1234K1ZT'); await w(600);" &
snap 14-business-gst-error "Login 14 · Business · GST invalid" "$REG \$('.au-type [data-v=firm]').click(); typ(F.firm,'Sharma Tech Solutions'); typ(F.gst,'08AABCF1234K1ZA'); await w(600);" &
snap 15-register-government "Login 15 · Create account · Government" "$REG \$('.au-type [data-v=government]').click(); await w(200);" &
snap 16-partner-code "Login 16 · Create account · Partner code" "$REG typ(F.name,'Rahul Sharma'); typ(F.mobile,'9876543210'); \$('#auPcT').click(); typ(F.partner,'FPX-2041');" &
wait
snap 17-register-otp "Login 17 · Create account · Verify OTP" "$REG $ROTP" &
snap 18-account-created "Login 18 · Success · Account created" "$REG typ(F.name,'Rahul Sharma'); $DONE \$('#auDoneT').textContent='Account created'; \$('#auDoneD').textContent='Hi Rahul, taking you to My Account…';" &
wait
