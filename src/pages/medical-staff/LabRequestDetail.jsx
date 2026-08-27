import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useLabRequest, useUpdateLabRequest } from "../../hooks/useLabRequests";
import { useAuth } from "../../contexts/AuthContext";
import { formatDate } from "../../utils/format";
import { LabStatusPill } from "./LabList";

export default function LabRequestDetail() {
  const { labId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: request, isLoading } = useLabRequest(labId);
  const updateLabRequest = useUpdateLabRequest();

  const [resultSummary, setResultSummary] = useState("");
  const [interpretation, setInterpretation] = useState("");

  if (isLoading) return <p className="text-sm text-clinic-400">Loading…</p>;
  if (!request) return <p className="text-sm text-clinic-400">Lab request not found.</p>;

  const saveResult = async () => {
    try {
      await updateLabRequest.mutateAsync({
        id: labId,
        result_summary: resultSummary || request.result_summary,
        result_interpretation: interpretation || request.result_interpretation,
        status: "completed",
      });
      toast.success("Result saved.");
    } catch (err) {
      toast.error(err.message || "Could not save the result.");
    }
  };

  const approve = async () => {
    try {
      await updateLabRequest.mutateAsync({
        id: labId,
        status: "approved",
        approved_by: profile.id,
        approved_at: new Date().toISOString(),
      });
      toast.success("Result approved.");
    } catch (err) {
      toast.error(err.message || "Could not approve the result.");
    }
  };

  const startProcessing = async () => {
    try {
      await updateLabRequest.mutateAsync({ id: labId, status: "in_progress" });
    } catch (err) {
      toast.error(err.message || "Could not update status.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-clinic-500 hover:text-clinic-700">
        <ArrowLeft size={16} /> Back to laboratory
      </button>

      <div className="card">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">{request.test_name}</h2>
            <p className="text-sm text-clinic-500">{request.test_category}</p>
          </div>
          <LabStatusPill status={request.status} />
        </div>

        <div className="space-y-2 border-t border-clinic-100 pt-4 text-sm dark:border-clinic-800">
          <p><span className="font-medium text-clinic-500">Patient:</span>{" "}
            <Link to={`/staff/patients/${request.patient_id}`} className="text-clinic-700 hover:underline dark:text-clinic-200">
              {request.patient?.full_name}
            </Link>
          </p>
          <p><span className="font-medium text-clinic-500">Requested by:</span> {request.requester?.full_name} on {formatDate(request.created_at)}</p>
          {request.approver && (
            <p><span className="font-medium text-clinic-500">Approved by:</span> {request.approver?.full_name} on {formatDate(request.approved_at)}</p>
          )}
        </div>
      </div>

      {request.status === "requested" && (
        <div className="card">
          <p className="mb-3 text-sm text-clinic-500">Sample collected and processing has started?</p>
          <button onClick={startProcessing} disabled={updateLabRequest.isPending} className="btn-secondary">
            Mark as in progress
          </button>
        </div>
      )}

      {(request.status === "requested" || request.status === "in_progress") && (
        <div className="card space-y-4">
          <h3 className="font-display text-sm font-semibold text-clinic-900 dark:text-white">Enter result</h3>
          <div>
            <label className="field-label">Result summary</label>
            <textarea
              rows={3}
              className="input-field"
              defaultValue={request.result_summary || ""}
              onChange={(e) => setResultSummary(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Interpretation</label>
            <textarea
              rows={2}
              className="input-field"
              defaultValue={request.result_interpretation || ""}
              onChange={(e) => setInterpretation(e.target.value)}
            />
          </div>
          <p className="text-xs text-clinic-400">
            Scanned report upload connects to Supabase Storage — add a storage bucket
            (e.g. <code>lab-reports</code>) and wire it here when ready.
          </p>
          <button onClick={saveResult} disabled={updateLabRequest.isPending} className="btn-primary">
            {updateLabRequest.isPending ? "Saving…" : "Save result"}
          </button>
        </div>
      )}

      {request.status === "completed" && (
        <>
          <div className="card space-y-2">
            <h3 className="font-display text-sm font-semibold text-clinic-900 dark:text-white">Result</h3>
            <p className="text-sm text-clinic-700 dark:text-clinic-200">{request.result_summary}</p>
            {request.result_interpretation && (
              <p className="text-sm text-clinic-500">{request.result_interpretation}</p>
            )}
          </div>
          <button onClick={approve} disabled={updateLabRequest.isPending} className="btn-primary">
            {updateLabRequest.isPending ? "Approving…" : "Approve result"}
          </button>
        </>
      )}

      {request.status === "approved" && (
        <div className="card space-y-2">
          <h3 className="font-display text-sm font-semibold text-clinic-900 dark:text-white">Approved result</h3>
          <p className="text-sm text-clinic-700 dark:text-clinic-200">{request.result_summary}</p>
          {request.result_interpretation && (
            <p className="text-sm text-clinic-500">{request.result_interpretation}</p>
          )}
        </div>
      )}
    </div>
  );
}
