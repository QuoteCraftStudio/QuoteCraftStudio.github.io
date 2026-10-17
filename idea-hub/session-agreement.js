// The browser shows the agreement once per signed-in session.
// If the Worker cannot provide a signed proof yet, its backwards-compatible
// agreement fields can be sent on writes without a repeated checkbox.
export function withSessionAgreement(path,data,{token,accepted,proof,termsVersion}){
 if(!data||!token||!accepted||proof)return data;
 const isCommunityWrite=path==='/api/profile'||path==='/api/content'||path==='/api/discussions'||/^\/api\/discussions\/[^/]+\/replies$/.test(path);
 return isCommunityWrite?{...data,agree:true,termsVersion}:data;
}
