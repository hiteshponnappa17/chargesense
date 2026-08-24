import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ChargersMap } from '@/components/charger/ChargersMap';
import { useToast } from '@/hooks/useToast';
import { createCharger, getCharger, updateCharger } from '@/services/charger.service';
import { errorMessage } from '@/lib/api';
import { AMENITIES, CONNECTOR_TYPES, POWER_LEVELS } from '@/lib/constants';
import { cn } from '@/lib/cn';
import type { Amenity, Charger, ChargerFormValues } from '@/types';

const DEFAULTS: ChargerFormValues = {
  name: '',
  description: '',
  address: '',
  city: 'Mysuru',
  latitude: 12.2958,
  longitude: 76.6394,
  connectorType: 'Type 2',
  powerKW: 7.4,
  pricePerKWh: 12,
  availableFrom: '06:00',
  availableUntil: '22:00',
  amenities: ['Parking'],
  status: 'active',
};

export default function ChargerForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState<ChargerFormValues>(DEFAULTS);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const loadExisting = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getCharger(id)
      .then((c) => {
        setForm({
          name: c.name,
          description: c.description,
          address: c.address,
          city: c.city,
          latitude: c.latitude,
          longitude: c.longitude,
          connectorType: c.connectorType,
          powerKW: c.powerKW,
          pricePerKWh: c.pricePerKWh,
          availableFrom: c.availableFrom,
          availableUntil: c.availableUntil,
          amenities: c.amenities,
          status: c.status,
        });
      })
      .catch(() => toast.error('Could not load charger'))
      .finally(() => setLoading(false));
  }, [id, toast]);

  useEffect(loadExisting, [loadExisting]);

  const patch = (fields: Partial<ChargerFormValues>) => setForm((f) => ({ ...f, ...fields }));

  const toggleAmenity = (a: Amenity) =>
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));

  const previewCharger = useMemo(
    () =>
      ({
        _id: 'preview',
        name: form.name || 'Your charger',
        address: form.address || form.city,
        city: form.city,
        latitude: form.latitude,
        longitude: form.longitude,
        connectorType: form.connectorType,
        powerKW: form.powerKW,
        pricePerKWh: form.pricePerKWh,
      }) as Charger,
    [form],
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.availableFrom >= form.availableUntil) {
      toast.error('Check availability', 'Opening time must be before closing time.');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && id) {
        await updateCharger(id, form);
        toast.success('Charger updated');
      } else {
        await createCharger(form);
        toast.success('Charger created');
      }
      navigate('/host/chargers');
    } catch (err) {
      toast.error('Could not save', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-[32rem] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('/host/chargers')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to my chargers
      </button>

      <PageHeader
        title={isEdit ? 'Edit charger' : 'Add a charger'}
        subtitle={isEdit ? 'Update your listing details.' : 'List a new charger for drivers to book.'}
      />

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Basics" />
            <div className="mt-4 space-y-4">
              <Input
                label="Charger name"
                required
                placeholder="e.g. Jayalakshmipuram Home Charger"
                value={form.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
              <Textarea
                label="Description"
                rows={3}
                placeholder="Anything drivers should know — access, parking spot, etc."
                value={form.description}
                onChange={(e) => patch({ description: e.target.value })}
              />
              <Input
                label="Address"
                required
                placeholder="Street / area"
                value={form.address}
                onChange={(e) => patch({ address: e.target.value })}
              />
              <Input
                label="City"
                required
                value={form.city}
                onChange={(e) => patch({ city: e.target.value })}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Charging specs" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Select
                label="Connector"
                value={form.connectorType}
                onChange={(e) => patch({ connectorType: e.target.value as ChargerFormValues['connectorType'] })}
                options={CONNECTOR_TYPES.map((c) => ({ value: c, label: c }))}
              />
              <Select
                label="Power output"
                value={String(form.powerKW)}
                onChange={(e) => patch({ powerKW: Number(e.target.value) })}
                options={POWER_LEVELS.map((p) => ({ value: String(p), label: `${p} kW` }))}
              />
              <Input
                label="Price per kWh (₹)"
                type="number"
                min={0}
                step={0.5}
                required
                value={String(form.pricePerKWh)}
                onChange={(e) => patch({ pricePerKWh: Number(e.target.value) })}
              />
              {isEdit && (
                <Select
                  label="Status"
                  value={form.status ?? 'active'}
                  onChange={(e) => patch({ status: e.target.value as ChargerFormValues['status'] })}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Disabled' },
                    { value: 'maintenance', label: 'Maintenance' },
                  ]}
                />
              )}
              <Input
                label="Opens (IST)"
                type="time"
                required
                value={form.availableFrom}
                onChange={(e) => patch({ availableFrom: e.target.value })}
              />
              <Input
                label="Closes (IST)"
                type="time"
                required
                value={form.availableUntil}
                onChange={(e) => patch({ availableUntil: e.target.value })}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Amenities" description="Select everything that applies." />
            <div className="mt-4 flex flex-wrap gap-2">
              {AMENITIES.map((a) => {
                const active = form.amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-sm font-medium transition',
                      active
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-50 text-muted ring-1 ring-inset ring-line hover:bg-slate-100',
                    )}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Location + submit */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Location" description="Set the map coordinates for your charger." />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Input
                label="Latitude"
                type="number"
                step="any"
                required
                value={String(form.latitude)}
                onChange={(e) => patch({ latitude: Number(e.target.value) })}
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                required
                value={String(form.longitude)}
                onChange={(e) => patch({ longitude: Number(e.target.value) })}
              />
            </div>
            <div className="mt-4">
              <ChargersMap chargers={[previewCharger]} selectedId="preview" className="h-56" />
              <p className="mt-2 text-xs text-muted">
                Tip: find your spot on Google Maps, right-click it and copy the coordinates.
              </p>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/host/chargers')}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} leftIcon={<Save className="h-4 w-4" />}>
              {isEdit ? 'Save changes' : 'Create charger'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
