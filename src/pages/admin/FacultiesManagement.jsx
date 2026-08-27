import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Trash2, Plus } from "lucide-react";
import {
  useFaculties, useDepartments, useCreateFaculty, useCreateDepartment,
  useDeleteFaculty, useDeleteDepartment,
} from "../../hooks/useFaculties";

export default function FacultiesManagement() {
  const { data: faculties, isLoading: facultiesLoading } = useFaculties();
  const { data: departments, isLoading: departmentsLoading } = useDepartments();
  const createFaculty = useCreateFaculty();
  const createDepartment = useCreateDepartment();
  const deleteFaculty = useDeleteFaculty();
  const deleteDepartment = useDeleteDepartment();

  const facultyForm = useForm();
  const departmentForm = useForm();

  const onCreateFaculty = async (values) => {
    try {
      await createFaculty.mutateAsync({ name: values.name, code: values.code.toUpperCase() });
      toast.success("Faculty added.");
      facultyForm.reset();
    } catch (err) {
      toast.error(err.message || "Could not add faculty.");
    }
  };

  const onCreateDepartment = async (values) => {
    try {
      await createDepartment.mutateAsync({
        faculty_id: values.facultyId,
        name: values.name,
        code: values.code.toUpperCase(),
      });
      toast.success("Department added.");
      departmentForm.reset();
    } catch (err) {
      toast.error(err.message || "Could not add department.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-clinic-900 dark:text-white">Faculties & Departments</h2>
        <p className="text-sm text-clinic-500">Reference data used across student and lecturer profiles.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 font-display text-sm font-semibold text-clinic-900 dark:text-white">Faculties</h3>
          <form onSubmit={facultyForm.handleSubmit(onCreateFaculty)} className="mb-4 flex gap-2">
            <input placeholder="Faculty name" className="input-field" {...facultyForm.register("name", { required: true })} />
            <input placeholder="Code" className="input-field w-24" {...facultyForm.register("code", { required: true })} />
            <button type="submit" disabled={createFaculty.isPending} className="btn-primary shrink-0 px-3">
              <Plus size={16} />
            </button>
          </form>

          {facultiesLoading && <p className="text-sm text-clinic-400">Loading…</p>}
          <ul className="divide-y divide-clinic-100 dark:divide-clinic-800">
            {faculties?.map((f) => (
              <li key={f.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-clinic-700 dark:text-clinic-200">{f.name} <span className="text-clinic-400">({f.code})</span></span>
                <button
                  onClick={() => deleteFaculty.mutate(f.id)}
                  className="text-clay-500 hover:text-clay-600"
                  aria-label={`Delete ${f.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3 className="mb-3 font-display text-sm font-semibold text-clinic-900 dark:text-white">Departments</h3>
          <form onSubmit={departmentForm.handleSubmit(onCreateDepartment)} className="mb-4 space-y-2">
            <select className="input-field" {...departmentForm.register("facultyId", { required: true })}>
              <option value="">Select faculty</option>
              {faculties?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <div className="flex gap-2">
              <input placeholder="Department name" className="input-field" {...departmentForm.register("name", { required: true })} />
              <input placeholder="Code" className="input-field w-24" {...departmentForm.register("code", { required: true })} />
              <button type="submit" disabled={createDepartment.isPending} className="btn-primary shrink-0 px-3">
                <Plus size={16} />
              </button>
            </div>
          </form>

          {departmentsLoading && <p className="text-sm text-clinic-400">Loading…</p>}
          <ul className="max-h-72 divide-y divide-clinic-100 overflow-y-auto dark:divide-clinic-800">
            {departments?.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-clinic-700 dark:text-clinic-200">
                  {d.name} <span className="text-clinic-400">({d.code}) · {d.faculties?.name}</span>
                </span>
                <button
                  onClick={() => deleteDepartment.mutate(d.id)}
                  className="text-clay-500 hover:text-clay-600"
                  aria-label={`Delete ${d.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
