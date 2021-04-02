# frozen_string_literal: true

class String
  def i?
    !!(self =~ /\A[-+]?[0-9]+\z/)
  end
end
