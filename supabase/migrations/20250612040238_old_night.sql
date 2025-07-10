/*
  # Create wallet and transaction tables for cross-device sync

  1. New Tables
    - `wallet_data`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `balance` (numeric)
      - `total_profit` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `deposits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `amount` (numeric)
      - `tx_hash` (text, optional)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `arbitrage_operations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `amount` (numeric)
      - `profit` (numeric)
      - `spread` (numeric)
      - `source_exchange` (text)
      - `target_exchange` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to access only their own data
    - Add indexes for performance

  3. Functions
    - Update timestamp function for wallet_data and deposits
*/

-- Create wallet_data table
CREATE TABLE IF NOT EXISTS wallet_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance numeric DEFAULT 0 NOT NULL,
  total_profit numeric DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create deposits table
CREATE TABLE IF NOT EXISTS deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  tx_hash text,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create arbitrage_operations table
CREATE TABLE IF NOT EXISTS arbitrage_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  profit numeric NOT NULL,
  spread numeric NOT NULL,
  source_exchange text NOT NULL,
  target_exchange text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE wallet_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbitrage_operations ENABLE ROW LEVEL SECURITY;

-- Create policies for wallet_data
CREATE POLICY "Users can read own wallet data" 
  ON wallet_data 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet data" 
  ON wallet_data 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet data" 
  ON wallet_data 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policies for deposits
CREATE POLICY "Users can read own deposits" 
  ON deposits 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deposits" 
  ON deposits 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deposits" 
  ON deposits 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policies for arbitrage_operations
CREATE POLICY "Users can read own arbitrage operations" 
  ON arbitrage_operations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own arbitrage operations" 
  ON arbitrage_operations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_data_user_id ON wallet_data(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON deposits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arbitrage_operations_user_id ON arbitrage_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_arbitrage_operations_created_at ON arbitrage_operations(created_at DESC);

-- Create triggers for updated_at
CREATE TRIGGER handle_wallet_data_updated_at
  BEFORE UPDATE ON wallet_data
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_deposits_updated_at
  BEFORE UPDATE ON deposits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to initialize wallet data for new users
CREATE OR REPLACE FUNCTION public.initialize_wallet_data()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallet_data (user_id, balance, total_profit)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize wallet data when user is created
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_wallet_data();