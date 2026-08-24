import { useEffect, useState, type FormEvent } from 'react';
import { Mail, Save } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { updateProfile } from '@/services/auth.service';
import { listCars } from '@/services/car.service';
import { errorMessage } from '@/lib/api';
import { formatDate, initials } from '@/lib/format';
import type { CarModel } from '@/types';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const isDriver = user?.role === 'driver';

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [carId, setCarId] = useState(user?.defaultCarModelId ?? '');
  const [registration, setRegistration] = useState(user?.vehicleRegistration ?? '');
  const [cars, setCars] = useState<CarModel[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isDriver) return;
    listCars()
      .then(setCars)
      .catch(() => setCars([]));
  }, [isDriver]);

  if (!user) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        ...(isDriver
          ? {
              defaultCarModelId: carId || null,
              vehicleRegistration: registration.trim() || null,
            }
          : {}),
      });
      setUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Could not save', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Manage your account details." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-600 text-2xl font-semibold text-white">
              {initials(user.name)}
            </span>
            <h2 className="mt-4 text-lg font-semibold text-ink">{user.name}</h2>
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <Mail className="h-3.5 w-3.5" /> {user.email}
            </p>
            <Badge tone={isDriver ? 'blue' : 'green'} className="mt-3">
              {isDriver ? 'Driver' : 'Host'}
            </Badge>
            <p className="mt-4 text-xs text-muted">Member since {formatDate(user.createdAt)}</p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <form onSubmit={onSubmit} className="space-y-4">
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input
              label="Email"
              value={user.email}
              disabled
              hint="Email can’t be changed."
            />
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />

            {isDriver && (
              <>
                <Select
                  label="Default vehicle"
                  value={carId ?? ''}
                  onChange={(e) => setCarId(e.target.value)}
                  placeholder="Select your EV (optional)"
                  options={cars.map((c) => ({
                    value: c._id,
                    label: `${c.brand} ${c.model} · ${c.batteryCapacityKWh} kWh`,
                  }))}
                />
                <Input
                  label="Vehicle registration"
                  value={registration ?? ''}
                  onChange={(e) => setRegistration(e.target.value)}
                  placeholder="KA-09-AB-1234"
                />
              </>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" loading={saving} leftIcon={<Save className="h-4 w-4" />}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
