import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type UploadFieldKey = "front" | "back" | "selfie";
type UploadState = "idle" | "uploading" | "ready";

type UploadField = {
  dataUrl: string;
  fileName: string;
  state: UploadState;
};

const initialUploadField: UploadField = {
  dataUrl: "",
  fileName: "",
  state: "idle",
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read the selected image."));
    reader.readAsDataURL(file);
  });
}

function VerificationPage() {
  const { token, user, updateUser } = useAuth();

  const [citizenshipNumber, setCitizenshipNumber] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("");
  const [frontUpload, setFrontUpload] = useState<UploadField>(initialUploadField);
  const [backUpload, setBackUpload] = useState<UploadField>(initialUploadField);
  const [selfieUpload, setSelfieUpload] = useState<UploadField>(initialUploadField);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setLoadingProfile(false);
        return;
      }

      try {
        const result = await api.getProfile(token);
        const profileUser = result?.user;

        if (profileUser) {
          setDistrict(profileUser.district || "");
          setProvince(profileUser.province || "");
        }
      } catch (loadError: unknown) {
        setError(getErrorMessage(loadError, "Failed to load verification form"));
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [token]);

  const verificationStatus = user?.verificationStatus || "unverified";

  const currentFlowState = useMemo(() => {
    if (
      frontUpload.state === "uploading" ||
      backUpload.state === "uploading" ||
      selfieUpload.state === "uploading" ||
      submitting
    ) {
      return "uploading";
    }

    if (verificationStatus === "pending") return "pending verification";
    if (verificationStatus === "verified") return "verified";
    if (verificationStatus === "rejected") return "rejected";

    return "ready to submit";
  }, [backUpload.state, frontUpload.state, selfieUpload.state, submitting, verificationStatus]);

  const statusTone =
    currentFlowState === "verified"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : currentFlowState === "pending verification"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : currentFlowState === "rejected"
      ? "bg-red-50 text-red-700 border-red-200"
      : currentFlowState === "uploading"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  const canSubmit =
    !submitting &&
    verificationStatus !== "verified" &&
    verificationStatus !== "pending" &&
    !!citizenshipNumber.trim() &&
    !!frontUpload.dataUrl &&
    !!backUpload.dataUrl;

  const setFieldState = (field: UploadFieldKey, nextValue: UploadField) => {
    if (field === "front") setFrontUpload(nextValue);
    if (field === "back") setBackUpload(nextValue);
    if (field === "selfie") setSelfieUpload(nextValue);
  };

  const handleFileChange =
    (field: UploadFieldKey, required = true) =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];

      setMessage("");
      setError("");

      if (!selectedFile) {
        if (!required) {
          setFieldState(field, initialUploadField);
        }
        return;
      }

      if (!ACCEPTED_IMAGE_TYPES.includes(selectedFile.type)) {
        e.target.value = "";
        setError("Please upload a JPG, PNG, or WEBP image only.");
        return;
      }

      if (selectedFile.size > MAX_IMAGE_SIZE_BYTES) {
        e.target.value = "";
        setError("Each image must be 5 MB or smaller.");
        return;
      }

      setFieldState(field, {
        dataUrl: "",
        fileName: selectedFile.name,
        state: "uploading",
      });

      try {
        const dataUrl = await readFileAsDataUrl(selectedFile);

        setFieldState(field, {
          dataUrl,
          fileName: selectedFile.name,
          state: "ready",
        });
      } catch (readError: unknown) {
        e.target.value = "";
        setFieldState(field, initialUploadField);
        setError(getErrorMessage(readError, "Failed to process the selected image."));
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("Please log in first.");
      return;
    }

    if (!citizenshipNumber.trim()) {
      setError("Citizenship number is required.");
      return;
    }

    if (!frontUpload.dataUrl || !backUpload.dataUrl) {
      setError("Please upload both front and back citizenship images.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      const result = await api.submitVerification(token, {
        citizenshipNumber,
        citizenshipFrontPhoto: frontUpload.dataUrl,
        citizenshipBackPhoto: backUpload.dataUrl,
        verificationSelfiePhoto: selfieUpload.dataUrl || "",
        district,
        province,
      });

      if (result?.user) {
        updateUser(result.user);
      }

      setMessage(result?.message || "Verification submitted successfully.");
      setFrontUpload(initialUploadField);
      setBackUpload(initialUploadField);
      setSelfieUpload(initialUploadField);
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, "Failed to submit verification"));
    } finally {
      setSubmitting(false);
    }
  };

  const statusDescription =
    currentFlowState === "uploading"
      ? "Your files are being prepared securely before submission."
      : currentFlowState === "pending verification"
      ? "Your documents are in private review. Only authorized admins or reviewers can access them."
      : currentFlowState === "verified"
      ? "Your public profile now shows only a verified badge. The documents remain private."
      : currentFlowState === "rejected"
      ? "Your submission needs another review cycle. Update the files and try again."
      : "Upload clear document images. They stay private and are never displayed on your public profile.";

  const uploadCards = [
    {
      key: "front" as const,
      label: "Citizenship front image",
      required: true,
      field: frontUpload,
    },
    {
      key: "back" as const,
      label: "Citizenship back image",
      required: true,
      field: backUpload,
    },
    {
      key: "selfie" as const,
      label: "Selfie with document (optional)",
      required: false,
      field: selfieUpload,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                Private identity verification
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
                Verify your account
              </h1>

              <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
                Submit your nagarikta privately for review. Public visitors only see your
                verification status, never the uploaded document images.
              </p>
            </div>

            <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${statusTone}`}>
              State: {currentFlowState}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-bold text-slate-950">Verification flow</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{statusDescription}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {["uploading", "pending verification", "verified", "rejected"].map((state) => (
                <div
                  key={state}
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    currentFlowState === state
                      ? "border-slate-900 bg-white text-slate-900"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {state}
                </div>
              ))}
            </div>
          </div>

          {message ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loadingProfile ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
              Loading verification form...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Citizenship number
                  </label>
                  <input
                    type="text"
                    value={citizenshipNumber}
                    onChange={(e) => setCitizenshipNumber(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-900/5"
                    placeholder="Enter citizenship number"
                    disabled={verificationStatus === "pending" || verificationStatus === "verified"}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Province
                  </label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-900/5"
                    placeholder="Enter province"
                    disabled={verificationStatus === "pending" || verificationStatus === "verified"}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    District
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-900/5"
                    placeholder="Enter district"
                    disabled={verificationStatus === "pending" || verificationStatus === "verified"}
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Upload rules</p>
                  <p className="mt-2 leading-6">
                    Accepted: JPG, PNG, WEBP. Maximum size: 5 MB per image.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {uploadCards.map((item) => (
                  <div key={item.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <label className="block text-sm font-semibold text-slate-800">
                      {item.label}
                    </label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileChange(item.key, item.required)}
                      disabled={verificationStatus === "pending" || verificationStatus === "verified"}
                      className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:font-semibold file:text-white"
                    />
                    <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">
                      {item.field.state}
                    </p>
                    <p className="mt-1 break-all text-sm text-slate-700">
                      {item.field.fileName || (item.required ? "No file selected yet." : "Optional")}
                    </p>
                  </div>
                ))}
              </div>

              {user?.verificationNotes ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-base font-bold text-slate-950">Reviewer note</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{user.verificationNotes}</p>
                </div>
              ) : null}

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-base font-bold text-slate-950">Privacy note</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Uploaded documents are stored for verification review only. Your public profile
                  shows status and badges, not the images or citizenship number.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Link
                  to="/profile"
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Back to profile
                </Link>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : verificationStatus === "rejected" ? "Resubmit for review" : "Submit for review"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

export default VerificationPage;
