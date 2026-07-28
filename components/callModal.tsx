import { providers } from "..";
type CallModalProps = {
  title: string;
  userProfile?: {
    firstname?: string;
    lastname?: string;
    photo?: string;
  };
  children: React.ReactNode;
};

export function CallModal({ title, userProfile, children }: CallModalProps) {
  const photoUrl = userProfile?.photo
    ? `${providers.APIUrl}/images/${userProfile.photo}`
    : "/images/clientProfile.png";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex h-[400px] w-full max-w-[420px] flex-col items-center justify-center space-y-4 rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {title}
        </h2>
        
        {/* Photo dynamisée */}
        <img
          src={photoUrl}
          alt="Profil"
          className="h-28 w-28 rounded-full border-2 border-slate-200 object-cover shadow dark:border-slate-700"
        />

        {/* Nom & Prénom dynamisés */}
        {userProfile && (
          <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
            {userProfile.firstname} {userProfile.lastname}
          </p>
        )}

        <div className="flex items-center space-x-4 pt-2">{children}</div>
      </div>
    </div>
  );
}